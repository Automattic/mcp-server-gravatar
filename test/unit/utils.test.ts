import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  normalizeEmail,
  validateEmail,
  generateIdentifierFromEmail,
  validateHash,
  generateMd5Hash,
  generateSha256Hash,
  getUserAgent,
  createApiConfiguration,
  mapHttpStatusToError,
} from '../../src/common/utils.js';
import {
  GravatarError,
  GravatarResourceNotFoundError,
  GravatarRateLimitError,
} from '../../src/common/errors.js';
import { Configuration } from '../../src/generated/gravatar-api/runtime.js';

describe('Email Utilities', () => {
  it('normalizeEmail should trim and lowercase email', () => {
    expect(normalizeEmail(' Test@Example.com ')).toBe('test@example.com');
    expect(normalizeEmail('USER@DOMAIN.COM')).toBe('user@domain.com');
    expect(normalizeEmail('  user@domain.com  ')).toBe('user@domain.com');
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

  it('generateIdentifierFromEmail should create correct hash', () => {
    // Use a valid email format to avoid needing to mock validateEmail
    const email = 'test@example.com';
    const hash = generateIdentifierFromEmail(email);

    // Should be a SHA256 hash (64 characters)
    expect(hash).toMatch(/^[a-f0-9]{64}$/);

    // Should be deterministic
    expect(generateIdentifierFromEmail(email)).toBe(hash);

    // Should normalize the email before hashing
    expect(generateIdentifierFromEmail(' Test@Example.com ')).toBe(hash);
  });

  it('generateIdentifierFromEmail should throw for invalid email', () => {
    expect(() => generateIdentifierFromEmail('invalid-email')).toThrow('Invalid email format');
  });
});

describe('Error Mapping', () => {
  it('mapHttpStatusToError should map 404 to GravatarResourceNotFoundError', async () => {
    const error = await mapHttpStatusToError(404, 'Not found');
    expect(error).toBeInstanceOf(GravatarResourceNotFoundError);
    expect(error.message).toContain('Not found');
  });

  it('mapHttpStatusToError should map 429 to GravatarRateLimitError with reset date', async () => {
    const now = Date.now();
    const error = await mapHttpStatusToError(429, 'Too many requests');
    expect(error).toBeInstanceOf(GravatarRateLimitError);
    expect(error.message).toContain('Too many requests');

    // Type assertion for TypeScript
    const rateLimitError = error as GravatarRateLimitError;
    expect(rateLimitError).toHaveProperty('resetAt');
    expect(rateLimitError.resetAt).toBeInstanceOf(Date);
    // Check that resetAt is approximately 1 minute in the future
    expect(rateLimitError.resetAt.getTime()).toBeGreaterThan(now);
    expect(rateLimitError.resetAt.getTime()).toBeLessThanOrEqual(now + 61000); // Allow 1 second buffer
  });

  it('mapHttpStatusToError should map 500 to GravatarError with Internal Server Error message', async () => {
    const error = await mapHttpStatusToError(500, 'Server error');
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.message).toContain('Internal Server Error');
    expect(error.message).toContain('Server error');
  });

  it('mapHttpStatusToError should map other status codes to GravatarError with HTTP Error message', async () => {
    const error = await mapHttpStatusToError(400, 'Bad request');
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.message).toContain('HTTP Error 400');
    expect(error.message).toContain('Bad request');
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

  it('generateMd5Hash should create correct hash', () => {
    // Empty string MD5 hash
    expect(generateMd5Hash('')).toBe('d41d8cd98f00b204e9800998ecf8427e');

    // Test with a known value
    expect(generateMd5Hash('test@example.com')).toMatch(/^[a-f0-9]{32}$/);

    // Should normalize the email before hashing
    expect(generateMd5Hash('test@example.com')).toBe(generateMd5Hash(' Test@Example.com '));
  });

  it('generateSha256Hash should create correct hash', () => {
    // Empty string SHA256 hash
    expect(generateSha256Hash('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );

    // Test with a known value
    expect(generateSha256Hash('test@example.com')).toMatch(/^[a-f0-9]{64}$/);

    // Should normalize the email before hashing
    expect(generateSha256Hash('test@example.com')).toBe(generateSha256Hash(' Test@Example.com '));
  });
});

describe('API Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GRAVATAR_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('getUserAgent should return a string containing version', () => {
    const userAgent = getUserAgent();
    expect(userAgent).toContain('mcp-server-gravatar');
    expect(userAgent).toContain('v');
  });

  it('createApiConfiguration should create a configuration with User-Agent', async () => {
    const config = await createApiConfiguration();
    expect(config).toBeInstanceOf(Configuration);
    expect(config.headers).toBeDefined();
    if (config.headers) {
      expect(config.headers['User-Agent']).toBeDefined();
      expect(config.headers['User-Agent']).toContain('mcp-server-gravatar');
    }
  });

  it('createApiConfiguration should include API key when available', async () => {
    process.env.GRAVATAR_API_KEY = 'test-api-key';
    const config = await createApiConfiguration();
    expect(config).toBeInstanceOf(Configuration);
    // The accessToken is a function in the Configuration class
    expect(typeof config.accessToken).toBe('function');
  });

  it('createApiConfiguration should not include API key when not available', async () => {
    const config = await createApiConfiguration();
    expect(config).toBeInstanceOf(Configuration);
    expect(config.accessToken).toBeUndefined();
  });
});
