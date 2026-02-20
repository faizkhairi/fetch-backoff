import type { RetryOptions, ResolvedRetryOptions } from './types.js'

const DEFAULTS: ResolvedRetryOptions = {
  attempts: 3,
  delay: 1000,
  backoff: 'exponential',
  jitter: true,
  retryOn: [429, 500, 502, 503, 504],
  timeout: undefined,
  onRetry: undefined,
}

export function resolveOptions(opts?: RetryOptions): ResolvedRetryOptions {
  return { ...DEFAULTS, ...opts }
}

export function shouldRetry(status: number, retryOn: number[]): boolean {
  return retryOn.includes(status)
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
