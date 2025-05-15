import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createAvatarService, avatarTools } from '../../src/services/avatar-service.js';
import type { IAvatarService } from '../../src/services/interfaces.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';
import fetch from 'node-fetch';

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
      // Mock the arrayBuffer method to return a specific value
      const mockArrayBuffer = new ArrayBuffer(20);
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };
      (mockFetch as any).mockResolvedValue(mockResponse);

      const result = await service.getAvatarById('test-hash');

      // Verify the response handling
      expect(mockResponse.arrayBuffer).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(20);

      // Verify the Buffer.from conversion was done correctly
      const expectedBuffer = Buffer.from(mockArrayBuffer);
      expect(result).toEqual(expectedBuffer);
    });

    it('should throw error when fetch fails with non-200 status', async () => {
      // Mock a failed response with status code and statusText
      mockFetch = vi.fn() as any;
      (mockFetch as any).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      });

      service = createAvatarService(mockFetch);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(
        'Failed to fetch avatar: Not Found',
      );
    });

    it('should throw error when fetch fails with server error', async () => {
      // Mock a failed response with a different status code
      mockFetch = vi.fn() as any;
      (mockFetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
      });

      service = createAvatarService(mockFetch);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(
        'Failed to fetch avatar: Internal Server Error',
      );
    });

    it('should throw error when fetch throws a network error', async () => {
      // Mock a network error
      const networkError = new Error('Network error');
      mockFetch = vi.fn() as any;
      (mockFetch as any).mockRejectedValue(networkError);

      service = createAvatarService(mockFetch);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow('Network error');
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(networkError);
    });

    it('should throw error when arrayBuffer() throws', async () => {
      // Mock arrayBuffer throwing an error
      const arrayBufferError = new Error('Failed to read array buffer');
      mockFetch = vi.fn() as any;
      (mockFetch as any).mockResolvedValue({
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: vi.fn().mockRejectedValue(arrayBufferError),
      });

      service = createAvatarService(mockFetch);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow(
        'Failed to read array buffer',
      );
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(arrayBufferError);
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
      // Mock the arrayBuffer method to return a specific value
      const mockArrayBuffer = new ArrayBuffer(30);
      const mockResponse = {
        ok: true,
        status: 200,
        statusText: 'OK',
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };
      (mockFetch as any).mockResolvedValue(mockResponse);

      const result = await service.getAvatarByEmail('test@example.com');

      // Verify the response handling
      expect(mockResponse.arrayBuffer).toHaveBeenCalled();
      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(30);
    });

    it('should handle errors from getAvatarById', async () => {
      // Create a spy on getAvatarById that throws an error
      const getAvatarByIdSpy = vi.spyOn(service, 'getAvatarById');
      const testError = new Error('Test error from getAvatarById');
      getAvatarByIdSpy.mockRejectedValue(testError);

      await expect(service.getAvatarByEmail('test@example.com')).rejects.toThrow(
        'Test error from getAvatarById',
      );
      await expect(service.getAvatarByEmail('test@example.com')).rejects.toThrow(testError);
    });
  });
});

describe('Avatar MCP Tools', () => {
  let mockFetch: typeof fetch;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
    vi.mocked(utils.getUserAgent).mockReturnValue('mcp-server-gravatar/v1.0.0');

    // Create a mock fetch function
    mockFetch = vi.fn() as any;
    (mockFetch as any).mockResolvedValue({
      ok: true,
      arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(10)),
      statusText: 'OK',
      status: 200,
    });

    // Replace the default fetch with our mock
    vi.mocked(fetch).mockImplementation(mockFetch);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById tool', () => {
    it('should have the correct name and description', () => {
      const tool = avatarTools[0];
      expect(tool.name).toBe('getAvatarById');
      expect(tool.description).toContain(
        'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash)',
      );
    });

    it('should call the service with correct parameters', async () => {
      const tool = avatarTools[0];
      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      } as any;

      const result = await tool.handler(params);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://secure.gravatar.com/avatar/test-hash'),
        expect.any(Object),
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle validation errors', async () => {
      const tool = avatarTools[0];
      vi.mocked(utils.validateHash).mockReturnValue(false);

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'invalid-hash',
      } as any;

      await expect(tool.handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getAvatarByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = avatarTools[1];
      expect(tool.name).toBe('getAvatarByEmail');
      expect(tool.description).toContain(
        'Get the avatar PNG image for a Gravatar profile using an email address',
      );
    });

    it('should call the service with correct parameters', async () => {
      const tool = avatarTools[1];
      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'test@example.com',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      } as any;

      const result = await tool.handler(params);

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('https://secure.gravatar.com/avatar/email-hash'),
        expect.any(Object),
      );
      expect(result).toBeInstanceOf(Buffer);
    });

    it('should handle validation errors', async () => {
      const tool = avatarTools[1];
      vi.mocked(utils.validateEmail).mockReturnValue(false);

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'invalid-email',
      } as any;

      await expect(tool.handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});
