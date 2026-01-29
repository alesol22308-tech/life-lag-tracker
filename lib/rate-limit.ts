/**
 * Rate limiting for API endpoints
 * Uses a sliding window algorithm with in-memory storage
 * For production, consider using Redis for distributed rate limiting
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
}

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

// Rate limit tiers
export const RATE_LIMIT_TIERS: Record<string, RateLimitConfig> = {
  standard: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60, // 60 requests per minute
  },
  premium: {
    windowMs: 60 * 1000,
    maxRequests: 300, // 300 requests per minute
  },
  unlimited: {
    windowMs: 60 * 1000,
    maxRequests: Infinity,
  },
};

// In-memory store for rate limiting
// Note: This resets on server restart. For production, use Redis
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 minutes
let lastCleanup = Date.now();

function cleanupStore() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  const maxAge = Math.max(...Object.values(RATE_LIMIT_TIERS).map(t => t.windowMs)) * 2;

  rateLimitStore.forEach((entry, key) => {
    if (now - entry.windowStart > maxAge) {
      rateLimitStore.delete(key);
    }
  });
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp when the window resets
  limit: number;
  retryAfter?: number; // Seconds until retry (only if not allowed)
}

/**
 * Check if a request is within rate limits
 * @param identifier - Unique identifier for the client (e.g., API key prefix or user ID)
 * @param tier - Rate limit tier (standard, premium, unlimited)
 * @returns Rate limit result with allowed status and metadata
 */
export function checkRateLimit(
  identifier: string,
  tier: string = 'standard'
): RateLimitResult {
  cleanupStore();

  const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.standard;
  const now = Date.now();
  const key = `${tier}:${identifier}`;

  let entry = rateLimitStore.get(key);

  // If no entry or window has expired, create new entry
  if (!entry || now - entry.windowStart >= config.windowMs) {
    entry = {
      count: 1,
      windowStart: now,
    };
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: Math.floor((now + config.windowMs) / 1000),
      limit: config.maxRequests,
    };
  }

  // Check if under limit
  if (entry.count < config.maxRequests) {
    entry.count++;
    rateLimitStore.set(key, entry);

    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetAt: Math.floor((entry.windowStart + config.windowMs) / 1000),
      limit: config.maxRequests,
    };
  }

  // Over limit
  const resetAt = entry.windowStart + config.windowMs;
  return {
    allowed: false,
    remaining: 0,
    resetAt: Math.floor(resetAt / 1000),
    limit: config.maxRequests,
    retryAfter: Math.ceil((resetAt - now) / 1000),
  };
}

/**
 * Create rate limit headers for response
 */
export function createRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  const headers: Record<string, string> = {
    'X-RateLimit-Limit': result.limit.toString(),
    'X-RateLimit-Remaining': result.remaining.toString(),
    'X-RateLimit-Reset': result.resetAt.toString(),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = result.retryAfter.toString();
  }

  return headers;
}

/**
 * Rate limit middleware result type
 */
export interface RateLimitMiddlewareResult {
  success: boolean;
  headers: Record<string, string>;
  error?: {
    message: string;
    retryAfter: number;
  };
}

/**
 * Apply rate limiting middleware
 * Returns headers to add to response and whether request is allowed
 */
export function applyRateLimit(
  identifier: string,
  tier: string = 'standard'
): RateLimitMiddlewareResult {
  const result = checkRateLimit(identifier, tier);
  const headers = createRateLimitHeaders(result);

  if (!result.allowed) {
    return {
      success: false,
      headers,
      error: {
        message: `Rate limit exceeded. Please retry after ${result.retryAfter} seconds.`,
        retryAfter: result.retryAfter || 60,
      },
    };
  }

  return {
    success: true,
    headers,
  };
}

/**
 * Reset rate limit for an identifier (useful for testing)
 */
export function resetRateLimit(identifier: string, tier: string = 'standard'): void {
  const key = `${tier}:${identifier}`;
  rateLimitStore.delete(key);
}

/**
 * Get current rate limit status without incrementing counter
 */
export function getRateLimitStatus(
  identifier: string,
  tier: string = 'standard'
): RateLimitResult {
  const config = RATE_LIMIT_TIERS[tier] || RATE_LIMIT_TIERS.standard;
  const now = Date.now();
  const key = `${tier}:${identifier}`;

  const entry = rateLimitStore.get(key);

  if (!entry || now - entry.windowStart >= config.windowMs) {
    return {
      allowed: true,
      remaining: config.maxRequests,
      resetAt: Math.floor((now + config.windowMs) / 1000),
      limit: config.maxRequests,
    };
  }

  const remaining = Math.max(0, config.maxRequests - entry.count);
  return {
    allowed: remaining > 0,
    remaining,
    resetAt: Math.floor((entry.windowStart + config.windowMs) / 1000),
    limit: config.maxRequests,
    retryAfter: remaining === 0 ? Math.ceil((entry.windowStart + config.windowMs - now) / 1000) : undefined,
  };
}
