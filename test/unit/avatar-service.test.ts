import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAvatarService } from '../../src/services/avatar-service.js';
import type { IAvatarService } from '../../src/services/interfaces.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';
import type fetch from 'node-fetch';

// Mock node-fetch
vi.mock('node-fetch', () => {
  return {
    default: vi.fn(),
  };
});

// Mock the utils functions
vi.mock('../../src/common/utils.js', () => {
  return {
    validateHash: vi.fn(),
    validateEmail: vi.fn(),
    generateIdentifierFromEmail: vi.fn(),
    getUserAgent: vi.fn(),
  };
});

describe('AvatarService', () => {
  let mockFetch: typeof fetch;
  let service: IAvatarService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
    vi.mocked(utils.getUserAgent).mockReturnValue('mcp-server-gravatar/v1.0.0');

    // Create a mock fetch function
    mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
      statusText: 'OK',
    });

    // Create the service with the mock fetch
    service = createAvatarService(mockFetch);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById', () => {
    it('should validate the hash', async () => {
      await service.getAvatarById('test-hash');
      expect(utils.validateHash).toHaveBeenCalledWith('test-hash');
    });

    it('should throw GravatarValidationError for invalid hash', async () => {
      vi.mocked(utils.validateHash).mockReturnValue(false);
      await expect(service.getAvatarById('invalid-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getAvatarById('invalid-hash')).rejects.toThrow('Invalid hash format');
    });

    it('should call fetch with correct URL for basic request', async () => {
      await service.getAvatarById('test-hash');
      expect(mockFetch).toHaveBeenCalledWith(
        'https://secure.gravatar.com/avatar/test-hash',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'mcp-server-gravatar/v1.0.0',
          }),
        }),
      );
    });

    it('should include size parameter when provided', async () => {
      await service.getAvatarById('test-hash', 200);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://secure.gravatar.com/avatar/test-hash?s=200',
        expect.any(Object),
      );
    });

    it('should include default option parameter when provided', async () => {
      await service.getAvatarById('test-hash', undefined, DefaultAvatarOption.IDENTICON);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://secure.gravatar.com/avatar/test-hash?d=identicon',
        expect.any(Object),
      );
    });

    it('should include force default parameter when true', async () => {
      await service.getAvatarById('test-hash', undefined, undefined, true);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://secure.gravatar.com/avatar/test-hash?f=y',
        expect.any(Object),
      );
    });

    it('should include rating parameter when provided', async () => {
      await service.getAvatarById('test-hash', undefined, undefined, undefined, Rating.PG);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://secure.gravatar.com/avatar/test-hash?r=pg',
        expect.any(Object),
      );
    });

    it('should include all parameters when provided', async () => {
      await service.getAvatarById('test-hash', 100, DefaultAvatarOption.ROBOHASH, true, Rating.G);

      // The order of query parameters might vary, so we'll check for each one separately
      const url = vi.mocked(mockFetch).mock.calls[0][0] as string;
      expect(url).toContain('https://secure.gravatar.com/avatar/test-hash?');
      expect(url).toContain('s=100');
      expect(url).toContain('d=robohash');
      expect(url).toContain('f=y');
      expect(url).toContain('r=g');
    });

    it('should return a buffer with the avatar data', async () => {
      const result = await service.getAvatarById('test-hash');
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should throw error when fetch fails', async () => {
      mockFetch = vi.fn().mockResolvedValue({
        ok: false,
        statusText: 'Not Found',
      });

      service = createAvatarService(mockFetch);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(
        'Failed to fetch avatar: Not Found',
      );
    });

    it('should throw error when fetch throws', async () => {
      mockFetch = vi.fn().mockRejectedValue(new Error('Network error'));

      service = createAvatarService(mockFetch);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow('Network error');
    });
  });

  describe('getAvatarByEmail', () => {
    it('should validate the email', async () => {
      await service.getAvatarByEmail('test@example.com');
      expect(utils.validateEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw GravatarValidationError for invalid email', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);
      await expect(service.getAvatarByEmail('invalid-email')).rejects.toThrow(
        GravatarValidationError,
      );
      await expect(service.getAvatarByEmail('invalid-email')).rejects.toThrow(
        'Invalid email format',
      );
    });

    it('should generate identifier from email', async () => {
      await service.getAvatarByEmail('test@example.com');
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should call getAvatarById with generated hash and all parameters', async () => {
      // Create a spy on the service's getAvatarById method
      const getAvatarByIdSpy = vi.spyOn(service, 'getAvatarById');

      await service.getAvatarByEmail(
        'test@example.com',
        200,
        DefaultAvatarOption.MONSTERID,
        true,
        Rating.R,
      );

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(getAvatarByIdSpy).toHaveBeenCalledWith(
        'email-hash',
        200,
        DefaultAvatarOption.MONSTERID,
        true,
        Rating.R,
      );
    });

    it('should return the avatar data', async () => {
      const result = await service.getAvatarByEmail('test@example.com');
      expect(result).toBeInstanceOf(Buffer);
    });
  });
});
