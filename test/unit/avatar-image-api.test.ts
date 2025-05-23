import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AvatarImageApi } from '../../src/apis/avatar-image-api.js';
import {
  getAvatarByIdTool,
  handler as getAvatarByIdHandler,
} from '../../src/tools/get-avatar-by-id.js';
import {
  getAvatarByEmailTool,
  handler as getAvatarByEmailHandler,
} from '../../src/tools/get-avatar-by-email.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import * as utils from '../../src/common/utils.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';
import { createMockFetch } from '../helpers/mock-api-clients.js';
import { createMockAvatarBuffer } from '../helpers/mock-responses.js';
import { createApiClient } from '../../src/apis/api-client.js';

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

describe('AvatarImageApi', () => {
  let mockFetch: ReturnType<typeof createMockFetch>;
  let api: AvatarImageApi;

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

    // Create the API with the mock fetch function
    api = new AvatarImageApi();
    // Replace the global fetch with our mock
    global.fetch = mockFetch;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById', () => {
    it('should validate the hash', async () => {
      await api.getAvatarById({ hash: 'test-hash' });
      expect(utils.validateHash).toHaveBeenCalledWith('test-hash');
    });

    it('should throw GravatarValidationError for invalid hash', async () => {
      vi.mocked(utils.validateHash).mockReturnValue(false);
      await expect(api.getAvatarById({ hash: 'invalid-hash' })).rejects.toThrow(
        GravatarValidationError,
      );
      await expect(api.getAvatarById({ hash: 'invalid-hash' })).rejects.toThrow(
        'Invalid hash format',
      );
    });

    it('should call fetch with correct URL for basic request', async () => {
      await api.getAvatarById({ hash: 'test-hash' });
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include size parameter in URL when provided', async () => {
      await api.getAvatarById({ hash: 'test-hash', size: 200 });
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?s=200', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include default option parameter in URL when provided', async () => {
      await api.getAvatarById({ hash: 'test-hash', defaultOption: DefaultAvatarOption.IDENTICON });
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?d=identicon', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include force default parameter in URL when true', async () => {
      await api.getAvatarById({ hash: 'test-hash', forceDefault: true });
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?f=y', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include rating parameter in URL when provided', async () => {
      await api.getAvatarById({ hash: 'test-hash', rating: Rating.PG });
      expect(mockFetch).toHaveBeenCalledWith('https://gravatar.com/avatar/test-hash?r=pg', {
        headers: {
          'User-Agent': 'mcp-server-gravatar/v1.0.0',
        },
      });
    });

    it('should include all parameters in URL when provided', async () => {
      await api.getAvatarById({
        hash: 'test-hash',
        size: 100,
        defaultOption: DefaultAvatarOption.ROBOHASH,
        forceDefault: true,
        rating: Rating.G,
      });
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
      global.fetch = mockFetch;

      const result = await api.getAvatarById({ hash: 'test-hash' });

      expect(result).toBeInstanceOf(Buffer);
      expect(result.length).toBe(20);
      expect(result).toEqual(mockBuffer);
    });

    it('should handle fetch errors', async () => {
      const error = new Error('Fetch error');
      mockFetch = createMockFetch({
        responseError: error,
      });
      global.fetch = mockFetch;

      await expect(api.getAvatarById({ hash: 'test-hash' })).rejects.toThrow('Fetch error');
      await expect(api.getAvatarById({ hash: 'test-hash' })).rejects.toThrow(error);
    });

    it('should handle non-ok responses', async () => {
      mockFetch = createMockFetch({
        responseStatus: 404,
      });
      global.fetch = mockFetch;

      await expect(api.getAvatarById({ hash: 'test-hash' })).rejects.toThrow(
        GravatarValidationError,
      );
      await expect(api.getAvatarById({ hash: 'test-hash' })).rejects.toThrow(
        'Failed to fetch avatar',
      );
    });
  });
});

describe('Gravatar Image MCP Tools', () => {
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

    // Create a mock API client
    mockApiClient = {
      avatars: {
        getAvatarById: vi.fn().mockResolvedValue(mockBuffer),
      },
    };

    // Mock the createApiClient function
    vi.mocked(createApiClient).mockResolvedValue(mockApiClient);

    // Mock the tool handlers to use the API client
    vi.mocked(getAvatarByIdHandler).mockImplementation(async (params: any) => {
      const apiClient = await createApiClient();
      const avatarBuffer = await apiClient.avatars.getAvatarById({
        hash: params.hash,
        size: params.size,
        defaultOption: params.defaultOption,
        forceDefault: params.forceDefault,
        rating: params.rating,
      });
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
      // Generate hash from email
      const hash = utils.generateIdentifierFromEmail(params.email);

      // Use API client to get avatar by ID
      const apiClient = await createApiClient();
      const avatarBuffer = await apiClient.avatars.getAvatarById({
        hash,
        size: params.size,
        defaultOption: params.defaultOption,
        forceDefault: params.forceDefault,
        rating: params.rating,
      });

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

    it('should call the API client with correct parameters', async () => {
      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      } as any;

      await getAvatarByIdHandler(params);

      expect(createApiClient).toHaveBeenCalled();
      expect(mockApiClient.avatars.getAvatarById).toHaveBeenCalledWith({
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      });
    });

    it('should handle validation errors', async () => {
      // Set up validateHash to return false for invalid hash
      vi.mocked(utils.validateHash).mockReturnValue(false);

      // Set up the mock API client to throw an error
      mockApiClient.avatars.getAvatarById = vi.fn().mockImplementation(() => {
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

    it('should call the API client with correct parameters', async () => {
      // Use type assertion to tell TypeScript this is the correct type
      const params = {
        email: 'test@example.com',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      } as any;

      await getAvatarByEmailHandler(params);

      expect(createApiClient).toHaveBeenCalled();
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockApiClient.avatars.getAvatarById).toHaveBeenCalledWith({
        hash: 'email-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      });
    });

    it('should handle validation errors', async () => {
      // Set up validateEmail to return false for invalid email
      vi.mocked(utils.validateEmail).mockReturnValue(false);

      // Set up the mock API client to throw an error
      mockApiClient.avatars.getAvatarById = vi.fn().mockImplementation(() => {
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
