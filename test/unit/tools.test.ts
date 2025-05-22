import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tools, handlers } from '../../src/tools/index.js';
import {
  getProfileByIdTool,
  handler as getProfileByIdHandler,
} from '../../src/tools/get-profile-by-id.js';
import {
  getProfileByEmailTool,
  handler as getProfileByEmailHandler,
} from '../../src/tools/get-profile-by-email.js';
import {
  getInterestsByIdTool,
  handler as getInterestsByIdHandler,
} from '../../src/tools/get-interests-by-id.js';
import {
  getInterestsByEmailTool,
  handler as getInterestsByEmailHandler,
} from '../../src/tools/get-interests-by-email.js';
import {
  getAvatarByIdTool,
  handler as getAvatarByIdHandler,
} from '../../src/tools/get-avatar-by-id.js';
import {
  getAvatarByEmailTool,
  handler as getAvatarByEmailHandler,
} from '../../src/tools/get-avatar-by-email.js';
import { GravatarValidationError } from '../../src/common/errors.js';
import { DefaultAvatarOption, Rating } from '../../src/common/types.js';

// Mock the service modules
vi.mock('../../src/services/profile-service.js', async () => {
  const actual = await vi.importActual('../../src/services/profile-service.js');
  return {
    ...actual,
    createProfileService: vi.fn(),
  };
});

vi.mock('../../src/services/experimental-service.js', async () => {
  const actual = await vi.importActual('../../src/services/experimental-service.js');
  return {
    ...actual,
    createExperimentalService: vi.fn(),
  };
});

vi.mock('../../src/services/gravatar-image-service.js', async () => {
  const actual = await vi.importActual('../../src/services/gravatar-image-service.js');
  return {
    ...actual,
    createGravatarImageService: vi.fn(),
  };
});

// Mock the utils functions
vi.mock('../../src/common/utils.js', async () => {
  const actual = await vi.importActual('../../src/common/utils.js');
  return {
    ...actual,
    validateHash: vi.fn().mockReturnValue(true),
    validateEmail: vi.fn().mockReturnValue(true),
    generateIdentifierFromEmail: vi.fn().mockReturnValue('email-hash'),
    getUserAgent: vi.fn().mockReturnValue('mcp-server-gravatar/v1.0.0'),
    createApiConfiguration: vi.fn().mockResolvedValue({}),
  };
});

// Import the utils after mocking
import * as utils from '../../src/common/utils.js';

// Mock the API client
vi.mock('../../src/apis/api-client.js', () => ({
  createApiClient: vi.fn(),
}));

// Import the mocked services, API client, and helpers
import { createProfileService } from '../../src/services/profile-service.js';
import { createExperimentalService } from '../../src/services/experimental-service.js';
import { createGravatarImageService } from '../../src/services/gravatar-image-service.js';
import { createApiClient } from '../../src/apis/api-client.js';
import { createMockApiClient } from '../helpers/mock-api-client.js';

describe('Tools Index', () => {
  it('should export all tools', () => {
    expect(tools).toHaveLength(6);
    expect(tools).toContain(getProfileByIdTool);
    expect(tools).toContain(getProfileByEmailTool);
    expect(tools).toContain(getInterestsByIdTool);
    expect(tools).toContain(getInterestsByEmailTool);
    expect(tools).toContain(getAvatarByIdTool);
    expect(tools).toContain(getAvatarByEmailTool);
  });

  it('should export handlers map with correct mappings', () => {
    expect(Object.keys(handlers)).toHaveLength(6);
    expect(handlers[getProfileByIdTool.name]).toBe(getProfileByIdHandler);
    expect(handlers[getProfileByEmailTool.name]).toBe(getProfileByEmailHandler);
    expect(handlers[getInterestsByIdTool.name]).toBe(getInterestsByIdHandler);
    expect(handlers[getInterestsByEmailTool.name]).toBe(getInterestsByEmailHandler);
    expect(handlers[getAvatarByIdTool.name]).toBe(getAvatarByIdHandler);
    expect(handlers[getAvatarByEmailTool.name]).toBe(getAvatarByEmailHandler);
  });
});

describe('Profile Tool Handlers', () => {
  let mockProfileService: any;
  let mockApiClient: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock profile service (for backward compatibility)
    mockProfileService = {
      getProfileById: vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
      getProfileByEmail: vi.fn().mockResolvedValue({
        hash: 'email-hash',
        displayName: 'Email User',
        profileUrl: 'https://gravatar.com/emailuser',
      }),
    };

    // Create a mock API client with custom implementations
    mockApiClient = createMockApiClient({
      // Custom implementation for profiles.getProfileById
      profilesGetProfileByIdImpl: vi.fn().mockImplementation(params => {
        if (params.profileIdentifier === 'email-hash') {
          return Promise.resolve({
            hash: 'email-hash',
            displayName: 'Email User',
            profileUrl: 'https://gravatar.com/emailuser',
          });
        }
        return Promise.resolve({
          hash: 'test-hash',
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        });
      }),

      // Custom implementation for avatars.getAvatarById
      avatarsGetAvatarByIdImpl: vi.fn().mockResolvedValue(Buffer.from('mock-avatar-data')),
    });

    // Mock the createProfileService function
    vi.mocked(createProfileService).mockResolvedValue(mockProfileService);

    // Mock the createApiClient function
    vi.mocked(createApiClient).mockResolvedValue(mockApiClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getProfileById handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { hash: 'test-hash' };
      const result = await getProfileByIdHandler(params);

      expect(createApiClient).toHaveBeenCalled();
      expect(mockApiClient.profiles.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: 'test-hash',
      });

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                hash: 'test-hash',
                displayName: 'Test User',
                profileUrl: 'https://gravatar.com/testuser',
              },
              null,
              2,
            ),
          },
        ],
      });
    });

    it('should handle service errors', async () => {
      // Setup the API client to throw an error
      mockApiClient.profiles.getProfileById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { hash: 'invalid-hash' };
      await expect(getProfileByIdHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getProfileByIdHandler(params)).rejects.toThrow('Invalid hash format');
    });
  });

  describe('getProfileByEmail handler', () => {
    it('should call the service with correct parameters', async () => {
      // Reset the mocks for this test
      vi.mocked(utils.validateEmail).mockReturnValue(true);
      vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

      const params = { email: 'test@example.com' };
      const result = await getProfileByEmailHandler(params);

      expect(createApiClient).toHaveBeenCalled();
      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockApiClient.profiles.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: 'email-hash',
      });

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                hash: 'email-hash',
                displayName: 'Email User',
                profileUrl: 'https://gravatar.com/emailuser',
              },
              null,
              2,
            ),
          },
        ],
      });
    });

    it('should handle service errors', async () => {
      // Setup the API client to throw an error
      mockApiClient.profiles.getProfileById.mockRejectedValue(
        new GravatarValidationError('Invalid email format'),
      );

      const params = { email: 'invalid-email' };
      await expect(getProfileByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getProfileByEmailHandler(params)).rejects.toThrow('Invalid email format');
    });
  });
});

describe('Experimental Tool Handlers', () => {
  let mockExperimentalService: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock experimental service
    mockExperimentalService = {
      getInferredInterestsById: vi.fn().mockResolvedValue([
        { id: 1, name: 'programming' },
        { id: 2, name: 'javascript' },
      ]),
      getInferredInterestsByEmail: vi.fn().mockResolvedValue([
        { id: 3, name: 'typescript' },
        { id: 4, name: 'react' },
      ]),
    };

    // Mock the createExperimentalService function
    vi.mocked(createExperimentalService).mockResolvedValue(mockExperimentalService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getInterestsById handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { hash: 'test-hash' };
      const result = await getInterestsByIdHandler(params);

      expect(createExperimentalService).toHaveBeenCalled();
      expect(mockExperimentalService.getInferredInterestsById).toHaveBeenCalledWith('test-hash');

      // Verify response format is correct (without checking exact content)
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toBe(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to verify it contains the expected data
      const parsedText = JSON.parse(result.content[0].text);
      expect(parsedText).toContain('programming');
      expect(parsedText).toContain('javascript');
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockExperimentalService.getInferredInterestsById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { hash: 'invalid-hash' };
      await expect(getInterestsByIdHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getInterestsByIdHandler(params)).rejects.toThrow('Invalid hash format');
    });
  });

  describe('getInterestsByEmail handler', () => {
    it('should call the service with correct parameters', async () => {
      const params = { email: 'test@example.com' };
      const result = await getInterestsByEmailHandler(params);

      expect(createExperimentalService).toHaveBeenCalled();
      expect(mockExperimentalService.getInferredInterestsByEmail).toHaveBeenCalledWith(
        'test@example.com',
      );

      // Verify response format is correct (without checking exact content)
      expect(result).toHaveProperty('content');
      expect(result.content).toBeInstanceOf(Array);
      expect(result.content.length).toBe(1);
      expect(result.content[0]).toHaveProperty('type', 'text');
      expect(result.content[0]).toHaveProperty('text');

      // Parse the JSON text to verify it contains the expected data
      const parsedText = JSON.parse(result.content[0].text);
      expect(parsedText).toContain('typescript');
      expect(parsedText).toContain('react');
    });

    it('should handle service errors', async () => {
      // Setup the service to throw an error
      mockExperimentalService.getInferredInterestsByEmail.mockRejectedValue(
        new GravatarValidationError('Invalid email format'),
      );

      const params = { email: 'invalid-email' };
      await expect(getInterestsByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getInterestsByEmailHandler(params)).rejects.toThrow('Invalid email format');
    });
  });
});

describe('Avatar Tool Handlers', () => {
  let mockAvatarService: any;
  let mockApiClient: any;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();

    // Create a mock avatar service (for backward compatibility)
    mockAvatarService = {
      getAvatarById: vi.fn().mockResolvedValue(Buffer.from('mock-avatar-data')),
      getAvatarByEmail: vi.fn().mockResolvedValue(Buffer.from('mock-email-avatar-data')),
    };

    // Create a mock API client with custom implementations
    mockApiClient = createMockApiClient({
      // Custom implementation for avatars.getAvatarById
      avatarsGetAvatarByIdImpl: vi.fn().mockResolvedValue(Buffer.from('mock-avatar-data')),

      // Custom implementation for profiles.getProfileById (for consistency)
      profilesGetProfileByIdImpl: vi.fn().mockImplementation(params => {
        if (params.profileIdentifier === 'email-hash') {
          return Promise.resolve({
            hash: 'email-hash',
            displayName: 'Email User',
            profileUrl: 'https://gravatar.com/emailuser',
          });
        }
        return Promise.resolve({
          hash: 'test-hash',
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        });
      }),
    });

    // Mock the createGravatarImageService function
    vi.mocked(createGravatarImageService).mockReturnValue(mockAvatarService);

    // Mock the createApiClient function
    vi.mocked(createApiClient).mockResolvedValue(mockApiClient);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('getAvatarById handler', () => {
    it('should call the API client with correct parameters', async () => {
      const params = {
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      };

      const result = await getAvatarByIdHandler(params);

      expect(createApiClient).toHaveBeenCalled();
      expect(mockApiClient.avatars.getAvatarById).toHaveBeenCalledWith({
        hash: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      });

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from('mock-avatar-data').toString('base64'),
            mimeType: 'image/png',
          },
        ],
      });
    });

    it('should handle minimal parameters', async () => {
      const params = { hash: 'test-hash' };

      await getAvatarByIdHandler(params);

      expect(mockApiClient.avatars.getAvatarById).toHaveBeenCalledWith({
        hash: 'test-hash',
        size: undefined,
        defaultOption: undefined,
        forceDefault: undefined,
        rating: undefined,
      });
    });

    it('should handle service errors', async () => {
      // Setup the API client to throw an error
      mockApiClient.avatars.getAvatarById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { hash: 'invalid-hash' };
      await expect(getAvatarByIdHandler(params)).rejects.toThrow(GravatarValidationError);
      await expect(getAvatarByIdHandler(params)).rejects.toThrow('Invalid hash format');
    });
  });

  describe('getAvatarByEmail handler', () => {
    it('should call the API client with correct parameters', async () => {
      // Reset the mocks for this test
      vi.mocked(utils.validateEmail).mockReturnValue(true);
      vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

      const params = {
        email: 'test@example.com',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      };

      const result = await getAvatarByEmailHandler(params);

      expect(createApiClient).toHaveBeenCalled();
      expect(mockApiClient.avatars.getAvatarById).toHaveBeenCalledWith({
        hash: 'email-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
        forceDefault: true,
        rating: Rating.PG,
      });

      // Verify response format
      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from('mock-avatar-data').toString('base64'),
            mimeType: 'image/png',
          },
        ],
      });
    });

    it('should handle minimal parameters', async () => {
      // Reset the mocks for this test
      vi.mocked(utils.validateEmail).mockReturnValue(true);
      vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');

      const params = { email: 'test@example.com' };

      await getAvatarByEmailHandler(params);

      expect(mockApiClient.avatars.getAvatarById).toHaveBeenCalledWith({
        hash: 'email-hash',
        size: undefined,
        defaultOption: undefined,
        forceDefault: undefined,
        rating: undefined,
      });
    });

    it('should handle service errors', async () => {
      // Setup the API client to throw an error
      mockApiClient.avatars.getAvatarById.mockRejectedValue(
        new GravatarValidationError('Invalid hash format'),
      );

      const params = { email: 'invalid-email' };
      await expect(getAvatarByEmailHandler(params)).rejects.toThrow(GravatarValidationError);
    });
  });
});
