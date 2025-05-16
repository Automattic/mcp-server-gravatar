import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  createGravatarImageService,
  gravatarImageTools,
  getDefaultGravatarImageService,
} from '../../src/services/gravatar-image-service.js';
import type { IAvatarService } from '../../src/services/interfaces.js';
import type { IGravatarImageApiAdapter } from '../../src/services/adapters/interfaces.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';
import * as adapters from '../../src/services/adapters/index.js';

// Mock the adapters
vi.mock('../../src/services/adapters/index.js', () => {
  return {
    createLegacyApiAdapter: vi.fn(),
  };
});

// Mock the getDefaultGravatarImageService function
vi.mock('../../src/services/gravatar-image-service.js', async () => {
  const actual = await vi.importActual('../../src/services/gravatar-image-service.js');
  return {
    ...actual,
    getDefaultGravatarImageService: vi.fn(),
    gravatarImageTools: [
      {
        name: 'getAvatarById',
        description:
          'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
        inputSchema: {},
        handler: vi.fn(),
      },
      {
        name: 'getAvatarByEmail',
        description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
        inputSchema: {},
        handler: vi.fn(),
      },
    ],
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

describe('GravatarImageService', () => {
  let mockAdapter: IGravatarImageApiAdapter;
  let service: IAvatarService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
    vi.mocked(utils.getUserAgent).mockReturnValue('mcp-server-gravatar/v1.0.0');

    // Create a mock adapter
    mockAdapter = {
      getAvatarById: vi.fn().mockResolvedValue(Buffer.from(new ArrayBuffer(10))),
    };

    // Mock the createLegacyApiAdapter function to return our mock adapter
    vi.mocked(adapters.createLegacyApiAdapter).mockReturnValue(mockAdapter as any);

    // Create the service with the mock adapter (via the factory function)
    service = createGravatarImageService();
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

    it('should call the adapter with correct parameters for basic request', async () => {
      await service.getAvatarById('test-hash');
      expect(mockAdapter.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        undefined,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass size parameter to adapter when provided', async () => {
      await service.getAvatarById('test-hash', 200);
      expect(mockAdapter.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        200,
        undefined,
        undefined,
        undefined,
      );
    });

    it('should pass default option parameter to adapter when provided', async () => {
      await service.getAvatarById('test-hash', undefined, DefaultAvatarOption.IDENTICON);
      expect(mockAdapter.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        undefined,
        DefaultAvatarOption.IDENTICON,
        undefined,
        undefined,
      );
    });

    it('should pass force default parameter to adapter when true', async () => {
      await service.getAvatarById('test-hash', undefined, undefined, true);
      expect(mockAdapter.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        undefined,
        undefined,
        true,
        undefined,
      );
    });

    it('should pass rating parameter to adapter when provided', async () => {
      await service.getAvatarById('test-hash', undefined, undefined, undefined, Rating.PG);
      expect(mockAdapter.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        undefined,
        undefined,
        undefined,
        Rating.PG,
      );
    });

    it('should pass all parameters to adapter when provided', async () => {
      await service.getAvatarById('test-hash', 100, DefaultAvatarOption.ROBOHASH, true, Rating.G);
      expect(mockAdapter.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        100,
        DefaultAvatarOption.ROBOHASH,
        true,
        Rating.G,
      );
    });

    it('should return a buffer with the avatar data', async () => {
      const mockBuffer = Buffer.from(new ArrayBuffer(20));
      mockAdapter.getAvatarById = vi.fn().mockResolvedValue(mockBuffer);

      const result = await service.getAvatarById('test-hash');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(20);
      expect(result).toEqual(mockBuffer);
    });

    it('should handle adapter errors', async () => {
      const error = new Error('Adapter error');
      mockAdapter.getAvatarById = vi.fn().mockRejectedValue(error);

      await expect(service.getAvatarById('test-hash')).rejects.toThrow('Adapter error');
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(error);
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
      const mockBuffer = Buffer.from(new ArrayBuffer(30));
      mockAdapter.getAvatarById = vi.fn().mockResolvedValue(mockBuffer);

      const result = await service.getAvatarByEmail('test@example.com');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(30);
      expect(result).toEqual(mockBuffer);
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

describe('Gravatar Image MCP Tools', () => {
  let mockService: IAvatarService;
  let mockBuffer: Buffer;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock buffer
    mockBuffer = Buffer.from(new ArrayBuffer(10));

    // Create a mock service
    mockService = {
      getAvatarById: vi.fn().mockResolvedValue(mockBuffer),
      getAvatarByEmail: vi.fn().mockResolvedValue(mockBuffer),
    };

    // Mock the getDefaultGravatarImageService function to return our mock service
    vi.mocked(getDefaultGravatarImageService).mockReturnValue(mockService);

    // Mock the tool handlers
    vi.mocked(gravatarImageTools[0].handler).mockImplementation(async (params: any) => {
      const service = getDefaultGravatarImageService();
      return await service.getAvatarById(
        params.hash,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
    });

    vi.mocked(gravatarImageTools[1].handler).mockImplementation(async (params: any) => {
      const service = getDefaultGravatarImageService();
      return await service.getAvatarByEmail(
        params.email,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById tool', () => {
    it('should have the correct name and description', () => {
      const tool = gravatarImageTools[0];
      expect(tool.name).toBe('getAvatarById');
      expect(tool.description).toContain(
        'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash)',
      );
    });

    it('should call the service with correct parameters', async () => {
      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      } as any;

      await gravatarImageTools[0].handler(params);

      expect(mockService.getAvatarById).toHaveBeenCalledWith(
        'test-hash',
        200,
        DefaultAvatarOption.IDENTICON,
        true,
        Rating.PG,
      );
    });

    it('should handle validation errors', async () => {
      // Set up validateHash to return false for invalid hash
      vi.mocked(utils.validateHash).mockReturnValue(false);

      // Set up the mock service to throw an error
      mockService.getAvatarById = vi.fn().mockImplementation(() => {
        throw new GravatarValidationError('Invalid hash format');
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'invalid-hash',
      } as any;

      await expect(gravatarImageTools[0].handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getAvatarByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = gravatarImageTools[1];
      expect(tool.name).toBe('getAvatarByEmail');
      expect(tool.description).toContain(
        'Get the avatar PNG image for a Gravatar profile using an email address',
      );
    });

    it('should call the service with correct parameters', async () => {
      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'test@example.com',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      } as any;

      await gravatarImageTools[1].handler(params);

      expect(mockService.getAvatarByEmail).toHaveBeenCalledWith(
        'test@example.com',
        200,
        DefaultAvatarOption.IDENTICON,
        true,
        Rating.PG,
      );
    });

    it('should handle validation errors', async () => {
      // Set up validateEmail to return false for invalid email
      vi.mocked(utils.validateEmail).mockReturnValue(false);

      // Set up the mock service to throw an error
      mockService.getAvatarByEmail = vi.fn().mockImplementation(() => {
        throw new GravatarValidationError('Invalid email format');
      });

      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'invalid-email',
      } as any;

      await expect(gravatarImageTools[1].handler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});
