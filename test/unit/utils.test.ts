import { describe, it, expect } from 'vitest';
import {
  normalize,
  generateIdentifier,
  assertNonEmpty,
  EmptyStringError,
  handleEmailToolError,
  handleIdToolError,
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

describe('Error Handling Utilities', () => {
  describe('handleEmailToolError', () => {
    it('should handle EmptyStringError', () => {
      const error = new EmptyStringError();
      const result = handleEmailToolError(error, 'test@example.com', 'fetch profile');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to fetch profile: Email parameter is missing or empty. Please provide a valid email address.',
          },
        ],
        isError: true,
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('API connection failed');
      const result = handleEmailToolError(error, 'test@example.com', 'fetch avatar');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to fetch avatar for email "test@example.com": API connection failed',
          },
        ],
        isError: true,
      });
    });

    it('should handle non-Error objects', () => {
      const error = 'String error message';
      const result = handleEmailToolError(error, 'user@domain.com', 'fetch interests');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to fetch interests for email "user@domain.com": String error message',
          },
        ],
        isError: true,
      });
    });

    it('should work with different operations', () => {
      const error = new EmptyStringError();

      const profileResult = handleEmailToolError(error, '', 'fetch profile');
      expect(profileResult.content[0].text).toContain('Failed to fetch profile:');

      const avatarResult = handleEmailToolError(error, '', 'fetch avatar');
      expect(avatarResult.content[0].text).toContain('Failed to fetch avatar:');

      const interestsResult = handleEmailToolError(error, '', 'fetch interests');
      expect(interestsResult.content[0].text).toContain('Failed to fetch interests:');
    });
  });

  describe('handleIdToolError', () => {
    it('should handle EmptyStringError', () => {
      const error = new EmptyStringError();
      const result = handleIdToolError(error, 'abc123', 'fetch profile');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to fetch profile: Identifier parameter is missing or empty. Please provide a valid identifier.',
          },
        ],
        isError: true,
      });
    });

    it('should handle generic errors', () => {
      const error = new Error('Invalid hash format');
      const result = handleIdToolError(error, 'invalid-hash', 'fetch avatar');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to fetch avatar for identifier "invalid-hash": Invalid hash format',
          },
        ],
        isError: true,
      });
    });

    it('should handle non-Error objects', () => {
      const error = 'Network timeout';
      const result = handleIdToolError(error, 'def456', 'fetch interests');

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: 'Failed to fetch interests for identifier "def456": Network timeout',
          },
        ],
        isError: true,
      });
    });

    it('should work with different operations', () => {
      const error = new EmptyStringError();

      const profileResult = handleIdToolError(error, '', 'fetch profile');
      expect(profileResult.content[0].text).toContain('Failed to fetch profile:');

      const avatarResult = handleIdToolError(error, '', 'fetch avatar');
      expect(avatarResult.content[0].text).toContain('Failed to fetch avatar:');

      const interestsResult = handleIdToolError(error, '', 'fetch interests');
      expect(interestsResult.content[0].text).toContain('Failed to fetch interests:');
    });
  });
});
