import { describe, it, expect } from 'vitest';
import { normalize, generateIdentifier } from '../../src/common/utils.js';

describe('String Utilities', () => {
  it('normalize should trim and lowercase string', () => {
    expect(normalize(' Test@Example.com ')).toBe('test@example.com');
    expect(normalize('USER@DOMAIN.COM')).toBe('user@domain.com');
    expect(normalize('  user@domain.com  ')).toBe('user@domain.com');
    expect(normalize('  SomeString  ')).toBe('somestring');
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

    // Empty string should produce known SHA256 hash
    expect(generateIdentifier('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });
});
