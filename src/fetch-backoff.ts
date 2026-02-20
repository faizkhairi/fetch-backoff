import type { FetchBackoffOptions } from './types.js'
import { resolveOptions, shouldRetry, createTimeoutSignal } from './utils.js'
import { calculateDelay, sleep } from './backoff.js'

/**
 * Drop-in replacement for `fetch` with configurable retry and backoff.
 *
 * - Returns the response (even if retryOn status) after exhausting attempts
 * - Throws on network/timeout errors after exhausting attempts
 *
 * @example
 * const res = await fetchBackoff('https://api.example.com/data', {
 *   retry: { attempts: 3, backoff: 'exponential', retryOn: [202, 429, 500] }
 * })
 */
export async function fetchBackoff(
  input: RequestInfo | URL,
  options: FetchBackoffOptions = {}
): Promise<Response> {
  const { retry: retryOpts, ...fetchOptions } = options
  const resolved = resolveOptions(retryOpts)

  let lastResponse: Response | null = null
  let lastError: Error | null = null

  for (let attempt = 0; attempt <= resolved.attempts; attempt++) {
    const isRetry = attempt > 0

    if (isRetry) {
      const delay = calculateDelay(resolved.backoff, resolved.delay, attempt, resolved.jitter)
      await sleep(delay)
      resolved.onRetry?.(attempt, lastResponse, lastError)
    }

    let timeoutHandle: { signal: AbortSignal; clear: () => void } | null = null
    let signal: AbortSignal | undefined = fetchOptions.signal as AbortSignal | undefined

    if (resolved.timeout !== undefined) {
      timeoutHandle = createTimeoutSignal(resolved.timeout)
      // Combine caller signal with timeout signal if both are present
      if (signal && typeof AbortSignal.any === 'function') {
        signal = AbortSignal.any([signal, timeoutHandle.signal])
      } else if (signal) {
        // Fallback: prefer caller signal (timeout won't apply)
        signal = signal
      } else {
        signal = timeoutHandle.signal
      }
    }

    try {
      const response = await fetch(input, { ...fetchOptions, signal })
      timeoutHandle?.clear()

      if (!shouldRetry(response.status, resolved.retryOn) || attempt >= resolved.attempts) {
        return response
      }

      lastResponse = response
      lastError = null
    } catch (error) {
      timeoutHandle?.clear()
      lastError = error instanceof Error ? error : new Error(String(error))
      lastResponse = null

      if (attempt >= resolved.attempts) {
        throw lastError
      }
    }
  }

  // Exhausted all retries
  if (lastResponse !== null) return lastResponse
  throw lastError ?? new Error('fetch-backoff: exhausted all retry attempts')
}
