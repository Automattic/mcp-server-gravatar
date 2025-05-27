import { describe, it, expect } from 'vitest';
import { normalize, generateIdentifier } from '../../src/common/utils.js';

describe('String Utilities', () => {
  it('normalize should trim and lowercase string', () => {
    expect(normalize(' Test@Example.com ')).toBe('test@example.com');
    expect(normalize('USER@DOMAIN.COM')).toBe('user@domain.com');
    expect(normalize('  user@domain.com  ')).toBe('user@domain.com');
    expect(normalize('  SomeString  ')).toBe('somestring');
  });

  it('normalize should handle edge cases gracefully', () => {
    // Handle undefined and null
    expect(normalize(undefined as any)).toBe('');
    expect(normalize(null as any)).toBe('');

    // Handle empty string
    expect(normalize('')).toBe('');
    expect(normalize('   ')).toBe('');

    // Handle non-string inputs
    expect(normalize(123 as any)).toBe('123');
    expect(normalize(true as any)).toBe('true');
    expect(normalize(false as any)).toBe('false');
  });

  it('generateIdentifier should create correct hash from any string', () => {
    const input = 'test@example.com';
    const hash = generateIdentifier(input);

    // Should be a SHA256 hash (64 characters)
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Should be deterministic
    expect(generateIdentifier(input)).toBe(hash);

    // Should normalize the input before hashing
    expect(generateIdentifier(' Test@Example.com ')).toBe(hash);

    // Should work with non-email strings
    const nonEmailHash = generateIdentifier('some-random-string');
    expect(nonEmailHash).toMatch(/^[a-f0-9]{64}$/);
    expect(generateIdentifier('some-random-string')).toBe(nonEmailHash);

    // Empty string should produce a valid hash
    const emptyHash = generateIdentifier('');
    expect(emptyHash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('generateIdentifier should handle edge cases gracefully', () => {
    // Handle undefined and null - should produce same hash as empty string
    const emptyHash = generateIdentifier('');
    expect(generateIdentifier(undefined as any)).toBe(emptyHash);
    expect(generateIdentifier(null as any)).toBe(emptyHash);

    // Handle non-string inputs
    expect(generateIdentifier(123 as any)).toMatch(/^[a-f0-9]{64}$/);
    expect(generateIdentifier(true as any)).toMatch(/^[a-f0-9]{64}$/);

    // Should be deterministic for same non-string inputs
    expect(generateIdentifier(123 as any)).toBe(generateIdentifier(123 as any));
  });
});
