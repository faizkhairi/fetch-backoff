import type { RetryOptions } from './types.js'
import { fetchBackoff } from './fetch-backoff.js'

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>

/**
 * Wrap any fetch-compatible function with retry logic.
 *
 * @example
 * const fetchWithRetry = withRetry(fetch, { attempts: 3 })
 * const res = await fetchWithRetry('https://api.example.com/data')
 */
export function withRetry(fn: FetchLike, retryOptions?: RetryOptions): FetchLike {
  return (input, init = {}) => fetchBackoff(input, { ...init, retry: retryOptions, fetchFn: fn })
}
