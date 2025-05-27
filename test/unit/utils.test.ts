import { describe, it, expect } from 'vitest';
import {
  normalize,
  validateEmail,
  generateIdentifier,
  validateHash,
} from '../../src/common/utils.js';

describe('String Utilities', () => {
  it('normalize should trim and lowercase string', () => {
    expect(normalize(' Test@Example.com ')).toBe('test@example.com');
    expect(normalize('USER@DOMAIN.COM')).toBe('user@domain.com');
    expect(normalize('  user@domain.com  ')).toBe('user@domain.com');
    expect(normalize('  SomeString  ')).toBe('somestring');
  });

  it('validateEmail should validate email format', () => {
    // Valid emails
    expect(validateEmail('test@example.com')).toBe(true);
    expect(validateEmail('user.name+tag@example.co.uk')).toBe(true);
    expect(validateEmail('user-name@domain.com')).toBe(true);

    // Invalid emails
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@domain')).toBe(false);
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

describe('Hash Utilities', () => {
  it('validateHash should accept valid MD5 hash', () => {
    expect(validateHash('00000000000000000000000000000000')).toBe(true);
    expect(validateHash('d41d8cd98f00b204e9800998ecf8427e')).toBe(true);
  });

  it('validateHash should accept valid SHA256 hash', () => {
    expect(validateHash('0000000000000000000000000000000000000000000000000000000000000000')).toBe(
      true,
    );
    expect(validateHash('e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855')).toBe(
      true,
    );
  });

  it('validateHash should reject invalid hash', () => {
    expect(validateHash('00000000000000000000000000000000000000000000000000000000000000000')).toBe(
      false,
    ); // Too long
    expect(validateHash('00000000000000000000000000000')).toBe(false); // Too short
    expect(validateHash('0000000000000000000000000000000g')).toBe(false); // Invalid character (MD5)
    expect(validateHash('0000000000000000000000000000000000000000000000000000000000000000g')).toBe(
      false,
    ); // Invalid character (SHA256)
  });
});
