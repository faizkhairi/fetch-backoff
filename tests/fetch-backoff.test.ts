import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { fetchBackoff } from '../src/fetch-backoff.js'

describe('fetchBackoff()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('returns response on first success without retrying', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const response = await fetchBackoff('https://example.com')

    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('retries on 500 and returns success on second attempt', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('error', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const promise = fetchBackoff('https://example.com', {
      retry: { attempts: 3, delay: 100, backoff: 'fixed', jitter: false }
    })
    await vi.runAllTimersAsync()

    const response = await promise
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('retries 202 until exhausted and returns final 202 response', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('', { status: 202 }))

    const promise = fetchBackoff('https://api.github.com/stats', {
      retry: { attempts: 3, delay: 100, backoff: 'fixed', jitter: false, retryOn: [202] }
    })
    await vi.runAllTimersAsync()

    const response = await promise
    expect(response.status).toBe(202)
    // initial + 3 retries = 4 total calls
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('does not retry 404 (not in default retryOn list)', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('not found', { status: 404 }))

    const response = await fetchBackoff('https://example.com')

    expect(response.status).toBe(404)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('calls onRetry callback on each retry with correct arguments', async () => {
    const onRetry = vi.fn()
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const promise = fetchBackoff('https://example.com', {
      retry: { attempts: 2, delay: 50, backoff: 'fixed', jitter: false, onRetry }
    })
    await vi.runAllTimersAsync()
    await promise

    expect(onRetry).toHaveBeenCalledTimes(1)
    expect(onRetry).toHaveBeenCalledWith(1, expect.any(Response), null)
  })

  it('throws after exhausting retries on network error', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('network failure'))

    const promise = fetchBackoff('https://example.com', {
      retry: { attempts: 2, delay: 50, backoff: 'fixed', jitter: false }
    })
    // Attach early catch to prevent unhandled rejection during fake timer execution.
    // The rejection is still available on `promise` for the expect() below.
    promise.catch(() => {})
    await vi.runAllTimersAsync()

    await expect(promise).rejects.toThrow('network failure')
    // initial + 2 retries = 3 total calls
    expect(fetch).toHaveBeenCalledTimes(3)
  })

  it('uses default retry options when no retry config provided', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const promise = fetchBackoff('https://example.com')
    await vi.runAllTimersAsync()

    const response = await promise
    // Default 3 attempts, should succeed on 4th call
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(4)
  })

  it('passes through fetch options (method, headers, body)', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    await fetchBackoff('https://example.com/api', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'value' }),
    })

    expect(fetch).toHaveBeenCalledWith(
      'https://example.com/api',
      expect.objectContaining({
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'value' }),
      })
    )
  })

  it('retries on 429 by default', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const promise = fetchBackoff('https://example.com', {
      retry: { delay: 50, backoff: 'fixed', jitter: false }
    })
    await vi.runAllTimersAsync()

    const response = await promise
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })
})
