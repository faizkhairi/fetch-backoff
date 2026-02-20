import { describe, it, expect } from 'vitest'
import { calculateDelay } from '../src/backoff.js'

describe('calculateDelay()', () => {
  describe('fixed strategy', () => {
    it('always returns base delay regardless of attempt', () => {
      expect(calculateDelay('fixed', 1000, 1, false)).toBe(1000)
      expect(calculateDelay('fixed', 1000, 5, false)).toBe(1000)
      expect(calculateDelay('fixed', 500, 10, false)).toBe(500)
    })
  })

  describe('linear strategy', () => {
    it('scales delay linearly with attempt number', () => {
      expect(calculateDelay('linear', 1000, 1, false)).toBe(1000)
      expect(calculateDelay('linear', 1000, 2, false)).toBe(2000)
      expect(calculateDelay('linear', 1000, 3, false)).toBe(3000)
    })

    it('uses base delay as the multiplier', () => {
      expect(calculateDelay('linear', 500, 4, false)).toBe(2000)
    })
  })

  describe('exponential strategy', () => {
    it('doubles delay each attempt', () => {
      expect(calculateDelay('exponential', 1000, 1, false)).toBe(1000)  // 1000 * 2^0
      expect(calculateDelay('exponential', 1000, 2, false)).toBe(2000)  // 1000 * 2^1
      expect(calculateDelay('exponential', 1000, 3, false)).toBe(4000)  // 1000 * 2^2
      expect(calculateDelay('exponential', 1000, 4, false)).toBe(8000)  // 1000 * 2^3
    })
  })

  describe('jitter', () => {
    it('returns value in [delay/2, delay] range with jitter enabled', () => {
      for (let i = 0; i < 30; i++) {
        const delay = calculateDelay('exponential', 1000, 1, true)
        expect(delay).toBeGreaterThanOrEqual(500)
        expect(delay).toBeLessThanOrEqual(1000)
      }
    })

    it('returns exact delay when jitter is disabled', () => {
      const delay = calculateDelay('fixed', 1000, 1, false)
      expect(delay).toBe(1000)
    })
  })
})
