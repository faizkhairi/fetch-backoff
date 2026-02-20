import type { BackoffStrategy } from './types.js'

/**
 * Calculate delay for a given retry attempt.
 * @param strategy - Backoff strategy to use
 * @param baseDelay - Base delay in ms
 * @param attempt - 1-indexed attempt number (first retry = 1)
 * @param jitter - Whether to add full jitter (randomizes between [delay/2, delay])
 */
export function calculateDelay(
  strategy: BackoffStrategy,
  baseDelay: number,
  attempt: number,
  jitter: boolean
): number {
  let delay: number

  switch (strategy) {
    case 'fixed':
      delay = baseDelay
      break
    case 'linear':
      delay = baseDelay * attempt
      break
    case 'exponential':
      // attempt=1 → delay*2^0=delay, attempt=2 → delay*2^1, etc.
      delay = baseDelay * Math.pow(2, attempt - 1)
      break
  }

  if (jitter) {
    // Full jitter: uniform random in [delay/2, delay]
    delay = delay * 0.5 + Math.random() * delay * 0.5
  }

  return Math.floor(delay)
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
