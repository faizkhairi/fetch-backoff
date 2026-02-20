export type BackoffStrategy = 'fixed' | 'linear' | 'exponential'

export interface RetryOptions {
  /** Max retry attempts after the initial request. Default: 3 */
  attempts?: number
  /** Base delay in ms between retries. Default: 1000 */
  delay?: number
  /** Backoff strategy: fixed, linear, or exponential. Default: 'exponential' */
  backoff?: BackoffStrategy
  /** Add random jitter to delay to avoid thundering herd. Default: true */
  jitter?: boolean
  /** HTTP status codes to retry on. Default: [429, 500, 502, 503, 504] */
  retryOn?: number[]
  /** Per-request timeout in ms. Default: undefined (no timeout) */
  timeout?: number
  /** Called before each retry attempt */
  onRetry?: (attempt: number, response: Response | null, error: Error | null) => void
}

export interface FetchBackoffOptions extends RequestInit {
  retry?: RetryOptions
  /** Custom fetch implementation. Defaults to global fetch. Useful for testing or `withRetry`. */
  fetchFn?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>
}

export interface ClientOptions {
  baseUrl: string
  headers?: Record<string, string>
  retry?: RetryOptions
}

/** Internal — all fields resolved with defaults applied */
export interface ResolvedRetryOptions {
  attempts: number
  delay: number
  backoff: BackoffStrategy
  jitter: boolean
  retryOn: number[]
  timeout: number | undefined
  onRetry: ((attempt: number, response: Response | null, error: Error | null) => void) | undefined
}
