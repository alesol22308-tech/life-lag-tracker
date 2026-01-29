/**
 * API key authentication for public API
 * Handles key generation, validation, and user lookup
 */

import { createHash, randomBytes } from 'crypto';

// API key prefix for identification
const API_KEY_PREFIX = 'llk_'; // Life-Lag Key

export interface ApiKeyInfo {
  userId: string;
  keyId: string;
  name: string;
  tier: string;
  scopes: string[];
}

export interface ApiKeyValidationResult {
  valid: boolean;
  user?: ApiKeyInfo;
  error?: string;
}

export interface GeneratedApiKey {
  key: string; // Full key (only shown once)
  keyPrefix: string; // First 8 chars for display
  keyHash: string; // Hash for storage
}

/**
 * Generate a new API key
 * @returns Generated key info (key is only available at creation time)
 */
export function generateApiKey(): GeneratedApiKey {
  // Generate 32 random bytes (256 bits)
  const randomPart = randomBytes(32).toString('base64url');
  const key = `${API_KEY_PREFIX}${randomPart}`;
  
  return {
    key,
    keyPrefix: key.substring(0, 12), // llk_ + first 8 chars of random part
    keyHash: hashApiKey(key),
  };
}

/**
 * Hash an API key for storage
 * Uses SHA-256 for consistent, fast hashing
 */
export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex');
}

/**
 * Validate an API key and return user info
 * @param supabase - Supabase client
 * @param apiKey - The API key to validate
 * @returns Validation result with user info if valid
 */
export async function validateApiKey(
  supabase: any,
  apiKey: string
): Promise<ApiKeyValidationResult> {
  // Check format
  if (!apiKey || !apiKey.startsWith(API_KEY_PREFIX)) {
    return { valid: false, error: 'Invalid API key format' };
  }

  // Hash the key to look up
  const keyHash = hashApiKey(apiKey);

  // Look up key in database
  const { data: keyData, error } = await supabase
    .from('api_keys')
    .select('id, user_id, name, rate_limit_tier, scopes, is_active, expires_at')
    .eq('key_hash', keyHash)
    .single();

  if (error || !keyData) {
    return { valid: false, error: 'Invalid API key' };
  }

  // Check if key is active
  if (!keyData.is_active) {
    return { valid: false, error: 'API key is inactive' };
  }

  // Check expiration
  if (keyData.expires_at && new Date(keyData.expires_at) < new Date()) {
    return { valid: false, error: 'API key has expired' };
  }

  // Update last used timestamp (don't await to avoid blocking)
  supabase
    .from('api_keys')
    .update({ last_used_at: new Date().toISOString() })
    .eq('id', keyData.id)
    .then(() => {})
    .catch((err: any) => console.error('Error updating last_used_at:', err));

  return {
    valid: true,
    user: {
      userId: keyData.user_id,
      keyId: keyData.id,
      name: keyData.name,
      tier: keyData.rate_limit_tier || 'standard',
      scopes: keyData.scopes || ['read:checkins', 'write:checkins', 'read:stats'],
    },
  };
}

/**
 * Check if user has a specific scope
 */
export function hasScope(userScopes: string[], requiredScope: string): boolean {
  return userScopes.includes(requiredScope) || userScopes.includes('*');
}

/**
 * Extract API key from request headers
 * Supports both Authorization header and X-API-Key header
 */
export function extractApiKey(request: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    if (token.startsWith(API_KEY_PREFIX)) {
      return token;
    }
  }

  // Check X-API-Key header
  const apiKeyHeader = request.headers.get('x-api-key');
  if (apiKeyHeader?.startsWith(API_KEY_PREFIX)) {
    return apiKeyHeader;
  }

  return null;
}

/**
 * Create a new API key for a user
 */
export async function createApiKey(
  supabase: any,
  userId: string,
  name: string,
  options?: {
    tier?: string;
    scopes?: string[];
    expiresAt?: Date;
  }
): Promise<{ success: boolean; key?: string; keyId?: string; error?: string }> {
  const generated = generateApiKey();

  const { data, error } = await supabase
    .from('api_keys')
    .insert({
      user_id: userId,
      name,
      key_hash: generated.keyHash,
      key_prefix: generated.keyPrefix,
      rate_limit_tier: options?.tier || 'standard',
      scopes: options?.scopes || ['read:checkins', 'write:checkins', 'read:stats'],
      expires_at: options?.expiresAt?.toISOString() || null,
      is_active: true,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating API key:', error);
    return { success: false, error: 'Failed to create API key' };
  }

  return {
    success: true,
    key: generated.key, // Only returned once at creation
    keyId: data.id,
  };
}

/**
 * Revoke an API key
 */
export async function revokeApiKey(
  supabase: any,
  keyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('api_keys')
    .update({ is_active: false })
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error revoking API key:', error);
    return { success: false, error: 'Failed to revoke API key' };
  }

  return { success: true };
}

/**
 * Delete an API key permanently
 */
export async function deleteApiKey(
  supabase: any,
  keyId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('api_keys')
    .delete()
    .eq('id', keyId)
    .eq('user_id', userId);

  if (error) {
    console.error('Error deleting API key:', error);
    return { success: false, error: 'Failed to delete API key' };
  }

  return { success: true };
}

/**
 * List user's API keys (without revealing full keys)
 */
export async function listApiKeys(
  supabase: any,
  userId: string
): Promise<{
  success: boolean;
  keys?: Array<{
    id: string;
    name: string;
    keyPrefix: string;
    tier: string;
    scopes: string[];
    isActive: boolean;
    createdAt: string;
    lastUsedAt: string | null;
    expiresAt: string | null;
  }>;
  error?: string;
}> {
  const { data, error } = await supabase
    .from('api_keys')
    .select('id, name, key_prefix, rate_limit_tier, scopes, is_active, created_at, last_used_at, expires_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error listing API keys:', error);
    return { success: false, error: 'Failed to list API keys' };
  }

  return {
    success: true,
    keys: (data || []).map((key: any) => ({
      id: key.id,
      name: key.name,
      keyPrefix: key.key_prefix,
      tier: key.rate_limit_tier,
      scopes: key.scopes,
      isActive: key.is_active,
      createdAt: key.created_at,
      lastUsedAt: key.last_used_at,
      expiresAt: key.expires_at,
    })),
  };
}

/**
 * Generate a webhook signing secret
 */
export function generateSigningSecret(): string {
  return `whsec_${randomBytes(32).toString('base64url')}`;
}

/**
 * Sign a webhook payload
 */
export function signWebhookPayload(payload: string, secret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const signaturePayload = `${timestamp}.${payload}`;
  const signature = createHash('sha256')
    .update(signaturePayload + secret)
    .digest('hex');
  
  return `t=${timestamp},v1=${signature}`;
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
  tolerance: number = 300 // 5 minutes
): boolean {
  try {
    const parts = signature.split(',').reduce((acc, part) => {
      const [key, value] = part.split('=');
      acc[key] = value;
      return acc;
    }, {} as Record<string, string>);

    const timestamp = parseInt(parts.t, 10);
    const expectedSignature = parts.v1;

    // Check timestamp tolerance
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > tolerance) {
      return false;
    }

    // Verify signature
    const signaturePayload = `${timestamp}.${payload}`;
    const computedSignature = createHash('sha256')
      .update(signaturePayload + secret)
      .digest('hex');

    return computedSignature === expectedSignature;
  } catch {
    return false;
  }
}
