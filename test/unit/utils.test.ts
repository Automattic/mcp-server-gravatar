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
} from '../../src/common/utils.js';
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

  it('createApiConfiguration should create a configuration with User-Agent', () => {
    const config = createApiConfiguration();
    expect(config).toBeInstanceOf(Configuration);
    expect(config.headers).toBeDefined();
    if (config.headers) {
      expect(config.headers['User-Agent']).toBeDefined();
      expect(config.headers['User-Agent']).toContain('mcp-server-gravatar');
    }
  });

  it('createApiConfiguration should include API key when available', () => {
    process.env.GRAVATAR_API_KEY = 'test-api-key';
    const config = createApiConfiguration();
    expect(config).toBeInstanceOf(Configuration);
    // The accessToken is a function in the Configuration class
    expect(typeof config.accessToken).toBe('function');
  });

  it('createApiConfiguration should not include API key when not available', () => {
    const config = createApiConfiguration();
    expect(config).toBeInstanceOf(Configuration);
    expect(config.accessToken).toBeUndefined();
  });
});
