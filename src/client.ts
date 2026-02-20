import type { ClientOptions, FetchBackoffOptions } from './types.js'
import { fetchBackoff } from './fetch-backoff.js'

/**
 * Create a pre-configured fetch client with a base URL, default headers, and retry options.
 *
 * @example
 * const client = createClient({
 *   baseUrl: 'https://api.github.com',
 *   headers: { Authorization: 'Bearer token' },
 *   retry: { attempts: 3, backoff: 'exponential' }
 * })
 * const res = await client.fetch('/users/faizkhairi/repos')
 */
export function createClient(options: ClientOptions) {
  const { baseUrl, headers: defaultHeaders = {}, retry: defaultRetry } = options

  return {
    fetch(path: string, fetchOptions: FetchBackoffOptions = {}): Promise<Response> {
      const url = new URL(path, baseUrl).toString()
      return fetchBackoff(url, {
        ...fetchOptions,
        headers: {
          ...defaultHeaders,
          ...(fetchOptions.headers as Record<string, string> | undefined),
        },
        retry: {
          ...defaultRetry,
          ...fetchOptions.retry,
        },
      })
    },
  }
}
