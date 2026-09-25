# Changelog

All notable changes to this project are documented in this file.

## 0.2.0

### Fixed

- Retries no longer default to running on non-idempotent HTTP methods.
  `shouldRetry()` only checked the response status, never the request
  method, so `POST`/`PATCH` requests were retried on a retryable status
  (e.g. 429/5xx) or a network error the same as `GET`, risking duplicated
  side effects (double-creates, double-charges). Only `GET`, `HEAD`,
  `OPTIONS`, `PUT`, `DELETE`, and `TRACE` (the idempotent methods per
  RFC 9110) are retried by default now. The method is read from
  `options.method`, or from a `Request` input's own method, defaulting to
  `GET`, and the check is case-insensitive.
- Fixed a comment in `calculateDelay()` that called the jitter formula
  "full jitter"; the formula (`[delay/2, delay]`) is "equal jitter". The
  math itself is unchanged.

### Added

- `retry.retryNonIdempotent` option (default `false`) to opt back in to
  retrying `POST`/`PATCH` requests, for endpoints that are safe to repeat
  (e.g. idempotency-key-backed APIs).

### Behavior change note

This is a behavior change in a pre-1.0 package: code relying on POST/PATCH
being retried automatically needs to pass `retry: { retryNonIdempotent: true }`
to keep the old behavior.

## 0.1.2 and earlier

No changelog was kept prior to 0.2.0. See git history for details.
