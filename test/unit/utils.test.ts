import { describe, it, expect } from 'vitest';
import { normalize, generateIdentifier, validateEmailParameter } from '../../src/common/utils.js';

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

    // Empty string should produce known SHA256 hash
    expect(generateIdentifier('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
  });

  it('generateIdentifier should handle edge cases gracefully', () => {
    // Handle undefined and null - should produce empty string hash
    const emptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';
    expect(generateIdentifier(undefined as any)).toBe(emptyHash);
    expect(generateIdentifier(null as any)).toBe(emptyHash);

    // Handle non-string inputs
    expect(generateIdentifier(123 as any)).toMatch(/^[a-f0-9]{64}$/);
    expect(generateIdentifier(true as any)).toMatch(/^[a-f0-9]{64}$/);

    // Should be deterministic for same non-string inputs
    expect(generateIdentifier(123 as any)).toBe(generateIdentifier(123 as any));
  });
});

describe('Validation Utilities', () => {
  it('validateEmailParameter should accept valid email strings', () => {
    // Should not throw for valid email strings
    expect(() => validateEmailParameter('test@example.com')).not.toThrow();
    expect(() => validateEmailParameter('user@domain.org')).not.toThrow();
    expect(() => validateEmailParameter('valid.email@test.co.uk')).not.toThrow();
  });

  it('validateEmailParameter should throw for invalid inputs', () => {
    // Should throw for null/undefined
    expect(() => validateEmailParameter(null)).toThrow(
      'Email parameter is missing or empty. Please provide a valid email address.',
    );
    expect(() => validateEmailParameter(undefined)).toThrow(
      'Email parameter is missing or empty. Please provide a valid email address.',
    );

    // Should throw for empty string
    expect(() => validateEmailParameter('')).toThrow(
      'Email parameter is missing or empty. Please provide a valid email address.',
    );

    // Should throw for string 'undefined'
    expect(() => validateEmailParameter('undefined')).toThrow(
      'Email parameter is missing or empty. Please provide a valid email address.',
    );
  });

  it('validateEmailParameter should accept non-email strings', () => {
    // The function only checks for presence, not email format
    expect(() => validateEmailParameter('not-an-email')).not.toThrow();
    expect(() => validateEmailParameter('123')).not.toThrow();
    expect(() => validateEmailParameter('some text')).not.toThrow();
  });
});
