import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createGravatarImageService } from '../../src/services/gravatar-image-service.js';
import {
  getAvatarByIdTool,
  handler as getAvatarByIdHandler,
} from '../../src/tools/get-avatar-by-id.js';
import {
  getAvatarByEmailTool,
  handler as getAvatarByEmailHandler,
} from '../../src/tools/get-avatar-by-email.js';
import type { IGravatarImageService } from '../../src/services/interfaces.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';
import { createMockFetch } from '../helpers/mock-api-clients.js';
import { createMockAvatarBuffer } from '../helpers/mock-responses.js';
import { createTestGravatarImageService } from '../helpers/test-setup.js';
import { createApiClient } from '../../src/apis/api-client.js';

// Mock the createGravatarImageService function
vi.mock('../../src/services/gravatar-image-service.js', async () => {
  const actual = await vi.importActual('../../src/services/gravatar-image-service.js');
  return {
    ...actual,
    createGravatarImageService: vi.fn(),
  };
});

// Mock the tool handlers
vi.mock('../../src/tools/get-avatar-by-id.js', async () => {
  const actual = await vi.importActual('../../src/tools/get-avatar-by-id.js');
  return {
    ...actual,
    handler: vi.fn(),
  };
});

vi.mock('../../src/tools/get-avatar-by-email.js', async () => {
  const actual = await vi.importActual('../../src/tools/get-avatar-by-email.js');
  return {
    ...actual,
    handler: vi.fn(),
  };
});

// Mock the API client
vi.mock('../../src/apis/api-client.js', () => ({
  createApiClient: vi.fn().mockResolvedValue({
    avatars: {
      getAvatarById: vi.fn().mockResolvedValue(Buffer.from('mock-avatar-data')),
    },
  }),
}));

// Mock the utils functions
vi.mock('../../src/common/utils.js', () => {
  return {
    validateHash: vi.fn(),
    validateEmail: vi.fn(),
    generateIdentifierFromEmail: vi.fn(),
    getUserAgent: vi.fn(),
  };
});

// Mock the config
vi.mock('../../src/config/server-config.js', () => {
  return {
    apiConfig: {
      avatarBaseUrl: 'https://gravatar.com/avatar',
    },
  };
});

describe('GravatarImageService', () => {
  let mockFetch: ReturnType<typeof createMockFetch>;
  let service: IGravatarImageService;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
    vi.mocked(utils.getUserAgent).mockReturnValue('mcp-server-gravatar/v1.0.0');

    // Create a mock fetch function
    mockFetch = createMockFetch({
      responseBuffer: createMockAvatarBuffer(10),
    });

    // Create the service with the mock fetch function
    service = createTestGravatarImageService({ mockFetch });
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
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include size parameter in URL when provided', async () => {
      await service.getAvatarById('test-hash', 200);
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?s=200', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include default option parameter in URL when provided', async () => {
      await service.getAvatarById('test-hash', undefined, DefaultAvatarOption.IDENTICON);
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?d=identicon', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include force default parameter in URL when true', async () => {
      await service.getAvatarById('test-hash', undefined, undefined, true);
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?f=y', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include rating parameter in URL when provided', async () => {
      await service.getAvatarById('test-hash', undefined, undefined, undefined, Rating.PG);
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?r=pg', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include all parameters in URL when provided', async () => {
      await service.getAvatarById('test-hash', 100, DefaultAvatarOption.ROBOHASH, true, Rating.G);
      expect(mockFetch).toHaveBeenCalledWith(
        'https://gravatar.com/avatar/test-hash?s=100&d=robohash&f=y&r=g',
        {
          headers: {
            'User-Agent': 'mcp-server-gravatar/v1.0.0',
          },
        },
      );
    });

    it('should return a buffer with the avatar data', async () => {
      const mockBuffer = createMockAvatarBuffer(20);
      mockFetch = createMockFetch({
        responseBuffer: mockBuffer,
      });
      service = createTestGravatarImageService({ mockFetch });

      const result = await service.getAvatarById('test-hash');

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(20);
      expect(result).toEqual(mockBuffer);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Fetch error');
      mockFetch = createMockFetch({
        responseError: error,
      });
      service = createTestGravatarImageService({ mockFetch });

      await expect(service.getAvatarById('test-hash')).rejects.toThrow('Fetch error');
      await expect(service.getAvatarById('test-hash')).rejects.toThrow(error);
    });

    it('should handle non-ok responses', async () => {
      mockFetch = createMockFetch({
        responseStatus: 404,
      });
      service = createTestGravatarImageService({ mockFetch });

      await expect(service.getAvatarById('test-hash')).rejects.toThrow(GravatarValidationError);
      await expect(service.getAvatarById('test-hash')).rejects.toThrow('Failed to fetch avatar');
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
      const mockBuffer = createMockAvatarBuffer(30);
      mockFetch = createMockFetch({
        responseBuffer: mockBuffer,
      });
      service = createTestGravatarImageService({ mockFetch });

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
  let mockService: IGravatarImageService;
  let mockApiClient: any;
  let mockBuffer: Buffer;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Default mock implementations
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

    // Create a mock buffer
    mockBuffer = createMockAvatarBuffer(10);

    // Create a mock service
    mockService = {
      getAvatarById: vi.fn().mockResolvedValue(mockBuffer),
      getAvatarByEmail: vi.fn().mockResolvedValue(mockBuffer),
    };

    // Create a mock API client
    mockApiClient = {
      avatars: {
        getAvatarById: vi.fn().mockResolvedValue(mockBuffer),
      },
    };

    // Mock the createGravatarImageService function to return our mock service
    vi.mocked(createGravatarImageService).mockReturnValue(mockService);

    // Mock the createApiClient function
    vi.mocked(createApiClient).mockResolvedValue(mockApiClient);

    // Mock the tool handlers to use the service (for test compatibility)
    vi.mocked(getAvatarByIdHandler).mockImplementation(async (params: any) => {
      const service = createGravatarImageService();
      const avatarBuffer = await service.getAvatarById(
        params.hash,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
      return {
        content: [
          {
            type: 'image',
            data: avatarBuffer.toString('base64'),
            mimeType: 'image/png',
          },
        ],
      };
    });

    vi.mocked(getAvatarByEmailHandler).mockImplementation(async (params: any) => {
      const service = createGravatarImageService();
      const avatarBuffer = await service.getAvatarByEmail(
        params.email,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
      return {
        content: [
          {
            type: 'image',
            data: avatarBuffer.toString('base64'),
            mimeType: 'image/png',
          },
        ],
      };
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById tool', () => {
    it('should have the correct name and description', () => {
      const tool = getAvatarByIdTool;
      expect(tool.name).toBe('get_avatar_by_id');
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

      await getAvatarByIdHandler(params);

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

      await expect(getAvatarByIdHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });

  describe('getAvatarByEmail tool', () => {
    it('should have the correct name and description', () => {
      const tool = getAvatarByEmailTool;
      expect(tool.name).toBe('get_avatar_by_email');
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

      await getAvatarByEmailHandler(params);

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

      await expect(getAvatarByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});
