/**
 * Exponential backoff retry utility for API calls
 * Retries failed operations with increasing delays: 1s, 2s, 4s
 */

type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  shouldRetry?: (error: any) => boolean;
};

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 8000, // 8 seconds
  shouldRetry: (error: any) => {
    // Retry on network errors and 5xx server errors
    if (!error.status) return true; // Network error
    return error.status >= 500 && error.status < 600;
  },
};

/**
 * Retry a function with exponential backoff
 * @param fn Function to retry
 * @param options Retry configuration
 * @returns Result of the function
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: any;
  
  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Don't retry if we've exhausted attempts
      if (attempt === opts.maxRetries) {
        break;
      }
      
      // Check if we should retry this error
      if (!opts.shouldRetry(error)) {
        throw error;
      }
      
      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelay * Math.pow(2, attempt),
        opts.maxDelay
      );
      
      console.log(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${delay}ms`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Retry a fetch request with exponential backoff
 * @param url URL to fetch
 * @param init Fetch options
 * @param options Retry configuration
 * @returns Fetch response
 */
export async function fetchWithRetry(
  url: string,
  init?: RequestInit,
  options: RetryOptions = {}
): Promise<Response> {
  return retryWithBackoff(async () => {
    const response = await fetch(url, init);
    
    // Throw error for non-2xx responses to trigger retry
    if (!response.ok) {
      const error: any = new Error(`HTTP ${response.status}: ${response.statusText}`);
      error.status = response.status;
      error.response = response;
      throw error;
    }
    
    return response;
  }, options);
}

/**
 * User-friendly error messages for common error types
 */
export function getUserFriendlyErrorMessage(error: any): string {
  // Network errors
  if (!navigator.onLine) {
    return "You appear to be offline. Please check your connection.";
  }
  
  if (error.message?.includes('Failed to fetch') || error.message?.includes('Network')) {
    return "Network error. Please check your connection and try again.";
  }
  
  // HTTP errors
  if (error.status) {
    switch (error.status) {
      case 400:
        return "Invalid request. Please check your input.";
      case 401:
        return "Please log in again to continue.";
      case 403:
        return "You don't have permission to do that.";
      case 404:
        return "The requested resource was not found.";
      case 429:
        return "Too many requests. Please wait a moment and try again.";
      case 500:
      case 502:
      case 503:
        return "Server error. Please try again in a moment.";
      default:
        return `Error: ${error.status}. Please try again.`;
    }
  }
  
  // Generic error
  return "Something went wrong. Please try again.";
}
