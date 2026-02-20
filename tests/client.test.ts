import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createClient } from '../src/client.js'

describe('createClient()', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  it('prepends baseUrl to relative path', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const client = createClient({ baseUrl: 'https://api.github.com' })
    await client.fetch('/users/faizkhairi')

    expect(fetch).toHaveBeenCalledWith(
      'https://api.github.com/users/faizkhairi',
      expect.any(Object)
    )
  })

  it('merges default headers with request-level headers', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const client = createClient({
      baseUrl: 'https://api.example.com',
      headers: { Authorization: 'Bearer token', Accept: 'application/json' },
    })
    await client.fetch('/resource', { headers: { 'X-Custom': 'value' } })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/resource',
      expect.objectContaining({
        headers: {
          Authorization: 'Bearer token',
          Accept: 'application/json',
          'X-Custom': 'value',
        },
      })
    )
  })

  it('request-level headers override default headers', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const client = createClient({
      baseUrl: 'https://api.example.com',
      headers: { Accept: 'application/json' },
    })
    await client.fetch('/resource', { headers: { Accept: 'text/plain' } })

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/resource',
      expect.objectContaining({
        headers: { Accept: 'text/plain' },
      })
    )
  })

  it('applies default retry options from client config', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce(new Response('', { status: 500 }))
      .mockResolvedValueOnce(new Response('ok', { status: 200 }))

    const client = createClient({
      baseUrl: 'https://api.example.com',
      retry: { attempts: 2, delay: 50, backoff: 'fixed', jitter: false },
    })

    const promise = client.fetch('/resource')
    await vi.runAllTimersAsync()

    const response = await promise
    expect(response.status).toBe(200)
    expect(fetch).toHaveBeenCalledTimes(2)
  })

  it('handles absolute path correctly via URL constructor', async () => {
    global.fetch = vi.fn().mockResolvedValue(new Response('ok', { status: 200 }))

    const client = createClient({ baseUrl: 'https://api.example.com/v1/' })
    await client.fetch('resource')

    // URL constructor: new URL('resource', 'https://api.example.com/v1/') → 'https://api.example.com/v1/resource'
    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.com/v1/resource',
      expect.any(Object)
    )
  })
})
