# fetch-backoff

Zero-dependency `fetch` wrapper with configurable retry, exponential backoff, jitter, and 202-polling. Works in Node.js 18+, Deno, Bun, and browsers.

[![CI](https://github.com/faizkhairi/fetch-backoff/actions/workflows/ci.yml/badge.svg)](https://github.com/faizkhairi/fetch-backoff/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/fetch-backoff)](https://www.npmjs.com/package/fetch-backoff)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

```bash
npm install fetch-backoff
```

## Usage

### `fetchBackoff` — Drop-in fetch replacement

```typescript
import { fetchBackoff } from 'fetch-backoff'

const response = await fetchBackoff('https://api.example.com/data', {
  retry: {
    attempts: 3,          // max retry attempts (default: 3)
    delay: 1000,          // base delay in ms (default: 1000)
    backoff: 'exponential', // 'fixed' | 'linear' | 'exponential' (default: 'exponential')
    jitter: true,         // add random jitter to delay (default: true)
    retryOn: [429, 500, 502, 503, 504], // status codes to retry (default)
    timeout: 10000,       // per-request timeout in ms (default: none)
    onRetry: (attempt, response, error) => {
      console.log(`Retry attempt ${attempt}`)
    },
  },
})
```

### 202 Polling (GitHub Stats API pattern)

```typescript
const response = await fetchBackoff('https://api.github.com/repos/owner/repo/stats/contributors', {
  headers: { Authorization: 'Bearer token' },
  retry: {
    attempts: 5,
    delay: 2000,
    backoff: 'fixed',
    retryOn: [202], // retry until data is ready
  },
})

if (response.status === 200) {
  const contributors = await response.json()
}
```

### `createClient` — Pre-configured client

```typescript
import { createClient } from 'fetch-backoff'

const github = createClient({
  baseUrl: 'https://api.github.com',
  headers: {
    Authorization: 'Bearer token',
    Accept: 'application/vnd.github.v3+json',
  },
  retry: { attempts: 3, backoff: 'exponential' },
})

const response = await github.fetch('/users/faizkhairi/repos')
const repos = await response.json()
```

### `withRetry` — Higher-order wrapper

```typescript
import { withRetry } from 'fetch-backoff'

const fetchWithRetry = withRetry(fetch, { attempts: 3 })
const response = await fetchWithRetry('https://api.example.com/data')
```

## API

### `fetchBackoff(input, options?)`

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retry.attempts` | `number` | `3` | Max retry attempts after initial request |
| `retry.delay` | `number` | `1000` | Base delay in ms |
| `retry.backoff` | `'fixed' \| 'linear' \| 'exponential'` | `'exponential'` | Backoff strategy |
| `retry.jitter` | `boolean` | `true` | Add random jitter to reduce thundering herd |
| `retry.retryOn` | `number[]` | `[429, 500, 502, 503, 504]` | HTTP status codes to retry |
| `retry.timeout` | `number` | `undefined` | Per-request timeout in ms |
| `retry.onRetry` | `function` | `undefined` | Called before each retry |

All standard `fetch` options (method, headers, body, signal, etc.) are passed through unchanged.

### Backoff Strategies

| Strategy | Delay formula | Example (base=1000ms) |
|----------|--------------|----------------------|
| `fixed` | `delay` | 1s, 1s, 1s |
| `linear` | `delay × attempt` | 1s, 2s, 3s |
| `exponential` | `delay × 2^(attempt-1)` | 1s, 2s, 4s |

With `jitter: true`, each delay is randomized to `[delay/2, delay]` to prevent thundering herd.

### Retry Behavior

- **Retryable status codes**: Returns final response after exhausting attempts (caller decides what to do)
- **Network/timeout errors**: Throws `Error` after exhausting attempts
- **Non-retryable status codes** (e.g. 404): Returns immediately, no retry

## License

MIT © [faizkhairi](https://github.com/faizkhairi)
