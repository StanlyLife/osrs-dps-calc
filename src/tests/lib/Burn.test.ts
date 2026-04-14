import { describe, expect, test } from '@jest/globals';
import { getExpectedBurn } from '@/lib/Burn';

describe('getExpectedBurn', () => {
  test('returns zero when a burn can never proc', () => {
    expect(getExpectedBurn(0, 3, 0.25)).toBe(0);
    expect(getExpectedBurn(1, 3, 0)).toBe(0);
  });

  test('returns positive expected burn for Drygore-like inputs', () => {
    expect(getExpectedBurn(1, 3, 0.25)).toBeCloseTo(2.2737228160, 8);
  });

  test('increases with hit chance', () => {
    const lowAccuracy = getExpectedBurn(0.25, 3, 0.25);
    const highAccuracy = getExpectedBurn(0.75, 3, 0.25);

    expect(highAccuracy).toBeGreaterThan(lowAccuracy);
  });
});