import { describe, it, expect } from 'vitest';
import {
  GravatarError,
  GravatarValidationError,
  GravatarResourceNotFoundError,
  GravatarAuthenticationError,
  GravatarPermissionError,
  GravatarRateLimitError,
  formatGravatarError,
  isGravatarError,
} from '../../src/common/errors.js';

describe('Error Classes', () => {
  it('GravatarError should be instance of Error', () => {
    const error = new GravatarError('Test error');
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('GravatarError');
    expect(error.message).toBe('Test error');
  });

  describe('mapHttpStatusToError', () => {
    it('should map status 400 to GravatarValidationError', async () => {
      const error = await import('../../src/common/errors.js').then(module =>
        module.mapHttpStatusToError(400, 'Bad request'),
      );
      expect(error).toBeInstanceOf(GravatarValidationError);
      expect(error.message).toContain('Bad request');
    });

    it('should map status 401 to GravatarAuthenticationError', async () => {
      const error = await import('../../src/common/errors.js').then(module =>
        module.mapHttpStatusToError(401, 'Unauthorized'),
      );
      expect(error).toBeInstanceOf(GravatarAuthenticationError);
      expect(error.message).toContain('Unauthorized');
    });

    it('should map status 403 to GravatarPermissionError', async () => {
      const error = await import('../../src/common/errors.js').then(module =>
        module.mapHttpStatusToError(403, 'Forbidden'),
      );
      expect(error).toBeInstanceOf(GravatarPermissionError);
      expect(error.message).toContain('Forbidden');
    });

    it('should map status 404 to GravatarResourceNotFoundError', async () => {
      const error = await import('../../src/common/errors.js').then(module =>
        module.mapHttpStatusToError(404, 'Not found'),
      );
      expect(error).toBeInstanceOf(GravatarResourceNotFoundError);
      expect(error.message).toContain('Not found');
    });

    it('should map status 429 to GravatarRateLimitError', async () => {
      const now = Date.now();
      const error = await import('../../src/common/errors.js').then(module =>
        module.mapHttpStatusToError(429, 'Too many requests'),
      );
      expect(error).toBeInstanceOf(GravatarRateLimitError);
      expect(error.message).toContain('Too many requests');

      // Type assertion to tell TypeScript this is a GravatarRateLimitError
      const rateLimitError = error as GravatarRateLimitError;
      expect(rateLimitError).toHaveProperty('resetAt');
      expect(rateLimitError.resetAt).toBeInstanceOf(Date);
      // Check that resetAt is approximately 1 minute in the future
      expect(rateLimitError.resetAt.getTime()).toBeGreaterThan(now);
      expect(rateLimitError.resetAt.getTime()).toBeLessThanOrEqual(now + 61000); // Allow 1 second buffer
    });

    it('should map other status codes to GravatarError', async () => {
      const error = await import('../../src/common/errors.js').then(module =>
        module.mapHttpStatusToError(500, 'Server error'),
      );
      expect(error).toBeInstanceOf(GravatarError);
      expect(error).not.toBeInstanceOf(GravatarValidationError);
      expect(error).not.toBeInstanceOf(GravatarAuthenticationError);
      expect(error).not.toBeInstanceOf(GravatarPermissionError);
      expect(error).not.toBeInstanceOf(GravatarResourceNotFoundError);
      expect(error).not.toBeInstanceOf(GravatarRateLimitError);
      expect(error.message).toContain('Server error');
    });
  });

  it('GravatarValidationError should be instance of GravatarError', () => {
    const error = new GravatarValidationError('Invalid input');
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.name).toBe('GravatarValidationError');
    expect(error.message).toContain('Validation Error');
    expect(error.message).toContain('Invalid input');
  });

  it('GravatarResourceNotFoundError should be instance of GravatarError', () => {
    const error = new GravatarResourceNotFoundError('Profile not found');
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.name).toBe('GravatarResourceNotFoundError');
    expect(error.message).toContain('Resource Not Found');
    expect(error.message).toContain('Profile not found');
  });

  it('GravatarAuthenticationError should be instance of GravatarError', () => {
    const error = new GravatarAuthenticationError('Invalid API key');
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.name).toBe('GravatarAuthenticationError');
    expect(error.message).toContain('Authentication Failed');
    expect(error.message).toContain('Invalid API key');
  });

  it('GravatarPermissionError should be instance of GravatarError', () => {
    const error = new GravatarPermissionError('Access denied');
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.name).toBe('GravatarPermissionError');
    expect(error.message).toContain('Permission Denied');
    expect(error.message).toContain('Access denied');
  });

  it('GravatarRateLimitError should include reset date', () => {
    const resetDate = new Date();
    const error = new GravatarRateLimitError('Too many requests', resetDate);
    expect(error).toBeInstanceOf(GravatarError);
    expect(error.name).toBe('GravatarRateLimitError');
    expect(error.message).toContain('Rate Limit Exceeded');
    expect(error.message).toContain('Too many requests');
    expect(error.resetAt).toBe(resetDate);
  });
});

describe('Error Utilities', () => {
  it('formatGravatarError should format validation errors', () => {
    const error = new GravatarValidationError('Invalid email');
    const formatted = formatGravatarError(error);
    expect(formatted).toContain('Validation Error');
    expect(formatted).toContain('Invalid email');
  });

  it('formatGravatarError should format resource not found errors', () => {
    const error = new GravatarResourceNotFoundError('Profile not found');
    const formatted = formatGravatarError(error);
    expect(formatted).toContain('Not Found');
    expect(formatted).toContain('Profile not found');
  });

  it('formatGravatarError should format authentication errors', () => {
    const error = new GravatarAuthenticationError('Invalid API key');
    const formatted = formatGravatarError(error);
    expect(formatted).toContain('Authentication Failed');
    expect(formatted).toContain('Invalid API key');
  });

  it('formatGravatarError should format permission errors', () => {
    const error = new GravatarPermissionError('Access denied');
    const formatted = formatGravatarError(error);
    expect(formatted).toContain('Permission Denied');
    expect(formatted).toContain('Access denied');
  });

  it('formatGravatarError should format rate limit errors with reset time', () => {
    const resetDate = new Date();
    const error = new GravatarRateLimitError('Too many requests', resetDate);
    const formatted = formatGravatarError(error);
    expect(formatted).toContain('Rate Limit Exceeded');
    expect(formatted).toContain('Too many requests');
    expect(formatted).toContain(resetDate.toISOString());
  });

  it('formatGravatarError should format generic Gravatar errors', () => {
    const error = new GravatarError('Unknown error');
    const formatted = formatGravatarError(error);
    expect(formatted).toContain('Gravatar API Error');
    expect(formatted).toContain('Unknown error');
  });

  it('isGravatarError should identify Gravatar errors', () => {
    expect(isGravatarError(new GravatarError('Test'))).toBe(true);
    expect(isGravatarError(new GravatarValidationError('Test'))).toBe(true);
    expect(isGravatarError(new GravatarResourceNotFoundError('Test'))).toBe(true);
    expect(isGravatarError(new GravatarAuthenticationError('Test'))).toBe(true);
    expect(isGravatarError(new GravatarPermissionError('Test'))).toBe(true);
    expect(isGravatarError(new GravatarRateLimitError('Test', new Date()))).toBe(true);
    expect(isGravatarError(new Error('Test'))).toBe(false);
    expect(isGravatarError('not an error')).toBe(false);
    expect(isGravatarError(null)).toBe(false);
    expect(isGravatarError(undefined)).toBe(false);
  });
});
