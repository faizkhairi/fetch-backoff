import type { RetryOptions, ResolvedRetryOptions } from './types.js'

const DEFAULTS: ResolvedRetryOptions = {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
  jitter: true,
  retryOn: [429, 500, 502, 503, 504],
  timeout: undefined,
  onRetry: undefined,
  retryNonIdempotent: false,
}

export function resolveOptions(opts?: RetryOptions): ResolvedRetryOptions {
  return { ...DEFAULTS, ...opts }
}

export function shouldRetry(status: number, retryOn: number[]): boolean {
  return retryOn.includes(status)
}

/** HTTP methods considered idempotent per RFC 9110. */
const IDEMPOTENT_METHODS = new Set(['GET', 'HEAD', 'OPTIONS', 'PUT', 'DELETE', 'TRACE'])

export function isIdempotentMethod(method: string): boolean {
  return IDEMPOTENT_METHODS.has(method.toUpperCase())
}

/**
 * Resolve the effective HTTP method for a request the same way `fetch` does:
 * an explicit `init.method` wins, otherwise a `Request` input's own method
 * is used, otherwise it defaults to GET.
 */
export function resolveMethod(input: RequestInfo | URL, init?: RequestInit): string {
  if (init?.method) return init.method.toUpperCase()
  if (typeof Request !== 'undefined' && input instanceof Request) return input.method.toUpperCase()
  return 'GET'
}

export function createTimeoutSignal(timeoutMs: number): {
  signal: AbortSignal
  clear: () => void
} {
  const controller = new AbortController()
  const timer = setTimeout(() => {
    controller.abort(new Error(`fetch-backoff: request timed out after ${timeoutMs}ms`))
  }, timeoutMs)
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  }
}
