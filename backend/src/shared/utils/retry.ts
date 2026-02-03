import { logger } from './logger.js';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  factor?: number;
  onRetry?: (error: Error, attempt: number) => void;
}

/**
 * Execute a function with exponential backoff retry logic
 *
 * @param fn - Async function to retry
 * @param options - Retry configuration
 * @returns Promise resolving to function result
 *
 * @example
 * const data = await retryWithBackoff(
 *   () => fetchFromAPI(),
 *   { maxRetries: 3, initialDelayMs: 1000 }
 * );
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    factor = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries) {
        logger.error('Max retries exceeded', lastError, {
          maxRetries,
          totalAttempts: attempt + 1,
        });
        break;
      }

      // Calculate delay with exponential backoff
      const currentDelay = Math.min(delay, maxDelayMs);

      logger.warn('Retrying after error', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: currentDelay,
        error: lastError.message,
      });

      // Call optional retry callback
      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      await sleep(currentDelay);

      // Increase delay for next attempt
      delay *= factor;
    }
  }

  throw lastError!;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function isRetryableError(error: any): boolean {
  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
    return true;
  }

  if (error.response?.status >= 500 && error.response?.status < 600) {
    return true;
  }

  if (error.code === 'ECONNABORTED') {
    return true;
  }

  return false;
}

export async function retryIfRetryable<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    factor = 2,
    onRetry,
  } = options;

  let lastError: Error;
  let delay = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Check if error is retryable
      if (!isRetryableError(error)) {
        logger.debug('Error is not retryable, throwing immediately', {
          error: lastError.message,
        });
        throw error;
      }

      if (attempt === maxRetries) {
        logger.error('Max retries exceeded', lastError, {
          maxRetries,
          totalAttempts: attempt + 1,
        });
        break;
      }

      const currentDelay = Math.min(delay, maxDelayMs);

      logger.warn('Retrying after retryable error', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: currentDelay,
        error: lastError.message,
      });

      if (onRetry) {
        onRetry(lastError, attempt + 1);
      }

      await sleep(currentDelay);
      delay *= factor;
    }
  }

  throw lastError!;
}
