import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { withRetry } from '../src/higher-order.js'

describe('withRetry()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns a function that retries on failure', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const fetchWithRetry = withRetry(fetch, {
      attempts: 2,
      delay: 50,
      backoff: 'fixed',
      jitter: false,
    })

    const promise = fetchWithRetry('https://example.com')
    await vi.runAllTimersAsync()

    const response = await promise
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('wrapped function passes through all fetch init options', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const fetchWithRetry = withRetry(fetch)
    await fetchWithRetry('https://example.com', {
      method: 'POST',
      body: 'test',
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com',
      expect.objectContaining({ method: 'POST', body: 'test' })
    )
  })

  it('uses default retry options when no retryOptions provided', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const fetchWithRetry = withRetry(fetch)
    const response = await fetchWithRetry('https://example.com')

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })
})
