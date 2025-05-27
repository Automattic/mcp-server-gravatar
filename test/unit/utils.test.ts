import { describe, it, expect } from 'vitest';
import {
  normalize,
  generateIdentifier,
  assertNonEmpty,
  EmptyStringError,
} from '../../src/common/utils.js';

describe('String Utilities', () => {
  it('normalize should trim and lowercase string', () => {
    expect(normalize(' Test@Example.com ')).toBe('test@example.com');
    expect(normalize('USER@DOMAIN.COM')).toBe('user@domain.com');
    expect(normalize('  user@domain.com  ')).toBe('user@domain.com');
    expect(normalize('  SomeString  ')).toBe('somestring');
  });

  it('normalize should throw for invalid inputs', () => {
    // Should throw EmptyStringError for invalid inputs
    expect(() => normalize(undefined as any)).toThrow(EmptyStringError);
    expect(() => normalize(null as any)).toThrow(EmptyStringError);
    expect(() => normalize('')).toThrow(EmptyStringError);
    expect(() => normalize('   ')).toThrow(EmptyStringError);
  });

  it('normalize should accept valid strings including "undefined"', () => {
    // The string 'undefined' is a valid string, not the undefined value
    expect(normalize('undefined')).toBe('undefined');
    expect(normalize('null')).toBe('null');
    expect(normalize('false')).toBe('false');
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
  });

  it('generateIdentifier should throw for invalid inputs', () => {
    // Should throw EmptyStringError for invalid inputs
    expect(() => generateIdentifier(undefined as any)).toThrow(EmptyStringError);
    expect(() => generateIdentifier(null as any)).toThrow(EmptyStringError);
    expect(() => generateIdentifier('')).toThrow(EmptyStringError);
    expect(() => generateIdentifier('   ')).toThrow(EmptyStringError);
  });
});

describe('Validation Utilities', () => {
  it('assertNonEmpty should accept valid strings', () => {
    // Should not throw for valid strings
    expect(() => assertNonEmpty('test@example.com')).not.toThrow();
    expect(() => assertNonEmpty('user@domain.org')).not.toThrow();
    expect(() => assertNonEmpty('valid.email@test.co.uk')).not.toThrow();
    expect(() => assertNonEmpty('not-an-email')).not.toThrow();
    expect(() => assertNonEmpty('123')).not.toThrow();
    expect(() => assertNonEmpty('some text')).not.toThrow();

    // The string 'undefined' is a valid string, not the undefined value
    expect(() => assertNonEmpty('undefined')).not.toThrow();
    expect(() => assertNonEmpty('null')).not.toThrow();
    expect(() => assertNonEmpty('false')).not.toThrow();
  });

  it('assertNonEmpty should throw EmptyStringError for invalid inputs', () => {
    // Should throw for null/undefined
    expect(() => assertNonEmpty(null as any)).toThrow(EmptyStringError);
    expect(() => assertNonEmpty(undefined as any)).toThrow(EmptyStringError);

    // Should throw for empty string
    expect(() => assertNonEmpty('')).toThrow(EmptyStringError);

    // Should throw for whitespace-only strings
    expect(() => assertNonEmpty('   ')).toThrow(EmptyStringError);
    expect(() => assertNonEmpty('\t\n')).toThrow(EmptyStringError);
  });

  it('EmptyStringError should have correct properties', () => {
    const error = new EmptyStringError();
    expect(error.name).toBe('EmptyStringError');
    expect(error.message).toBe('Parameter is missing or empty');
    expect(error instanceof Error).toBe(true);
    expect(error instanceof EmptyStringError).toBe(true);
  });
});
