import { describe, it, expect, vi, beforeEach } from 'vitest';
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
import { DefaultAvatarOption } from '../../src/common/types.js';

// Mock the generated API clients
vi.mock('../../src/generated/gravatar-api/apis/ProfilesApi.js', () => ({
  ProfilesApi: vi.fn(),
}));

vi.mock('../../src/generated/gravatar-api/apis/ExperimentalApi.js', () => ({
  ExperimentalApi: vi.fn(),
}));

// Mock fetch for avatar tools
global.fetch = vi.fn();

// Mock the config functions
vi.mock('../../src/config/server-config.js', () => ({
  createRestApiConfig: vi.fn().mockReturnValue({}),
  getUserAgent: vi.fn().mockReturnValue('mcp-server-gravatar/v1.0.0'),
}));

// Mock utils for validation
vi.mock('../../src/common/utils.js', async () => {
  const actual = await vi.importActual('../../src/common/utils.js');
  return {
    ...actual,
    validateHash: vi.fn(),
    validateEmail: vi.fn(),
    generateIdentifierFromEmail: vi.fn(),
  };
});

import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';
import * as utils from '../../src/common/utils.js';

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

describe('Profile Tools', () => {
  let mockProfilesApi: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock ProfilesApi instance
    mockProfilesApi = {
      getProfileById: vi.fn(),
    };

    vi.mocked(ProfilesApi).mockImplementation(() => mockProfilesApi);
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
  });

  describe('getProfileById', () => {
    it('should handle valid profile ID', async () => {
      const mockProfile = {
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      };

      mockProfilesApi.getProfileById.mockResolvedValue(mockProfile);

      const result = await getProfileByIdHandler({ profileIdentifier: 'test-hash' });

      expect(mockProfilesApi.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: 'test-hash',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProfile, null, 2),
          },
        ],
      });
    });

    it('should handle API errors', async () => {
      mockProfilesApi.getProfileById.mockRejectedValue(new Error('API Error'));

      await expect(getProfileByIdHandler({ profileIdentifier: 'test-hash' })).rejects.toThrow(
        'API Error',
      );
    });
  });

  describe('getProfileByEmail', () => {
    it('should handle valid email', async () => {
      const mockProfile = {
        hash: 'email-hash',
        displayName: 'Email User',
        profileUrl: 'https://gravatar.com/emailuser',
      };

      mockProfilesApi.getProfileById.mockResolvedValue(mockProfile);

      const result = await getProfileByEmailHandler({ email: 'test@example.com' });

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockProfilesApi.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: 'email-hash',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(mockProfile, null, 2),
          },
        ],
      });
    });

    it('should validate email format', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);

      await expect(getProfileByEmailHandler({ email: 'invalid-email' })).rejects.toThrow(
        GravatarValidationError,
      );
    });
  });
});

describe('Interest Tools', () => {
  let mockExperimentalApi: any;

  beforeEach(() => {
    vi.clearAllMocks();

    // Create mock ExperimentalApi instance
    mockExperimentalApi = {
      getProfileInferredInterestsById: vi.fn(),
    };

    vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi);
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
  });

  describe('getInterestsById', () => {
    it('should handle valid profile ID', async () => {
      const mockInterests = [{ name: 'programming' }, { name: 'javascript' }];

      mockExperimentalApi.getProfileInferredInterestsById.mockResolvedValue(mockInterests);

      const result = await getInterestsByIdHandler({ profileIdentifier: 'test-hash' });

      expect(mockExperimentalApi.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: 'test-hash',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(['programming', 'javascript'], null, 2),
          },
        ],
      });
    });

    // Hash format validation is now handled at the schema level before the handler is called
    // This is tested in validation.test.ts instead
  });

  describe('getInterestsByEmail', () => {
    it('should handle valid email', async () => {
      const mockInterests = [{ name: 'typescript' }, { name: 'react' }];

      mockExperimentalApi.getProfileInferredInterestsById.mockResolvedValue(mockInterests);

      const result = await getInterestsByEmailHandler({ email: 'test@example.com' });

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(mockExperimentalApi.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: 'email-hash',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(['typescript', 'react'], null, 2),
          },
        ],
      });
    });

    it('should validate email format', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);

      await expect(getInterestsByEmailHandler({ email: 'invalid-email' })).rejects.toThrow(
        GravatarValidationError,
      );
    });
  });
});

describe('Avatar Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
  });

  describe('getAvatarById', () => {
    it('should handle valid avatar ID', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await getAvatarByIdHandler({
        avatarIdentifier: 'test-hash',
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
      });

      expect(fetch).toHaveBeenCalledWith(
        'https://gravatar.com/avatar/test-hash?s=200&d=identicon',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'mcp-server-gravatar/v1.0.0',
          }),
        }),
      );

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/png',
          },
        ],
      });
    });

    it('should validate hash format', async () => {
      vi.mocked(utils.validateHash).mockReturnValue(false);

      await expect(getAvatarByIdHandler({ avatarIdentifier: 'invalid-hash' })).rejects.toThrow(
        GravatarValidationError,
      );
    });

    it('should handle fetch errors', async () => {
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      await expect(getAvatarByIdHandler({ avatarIdentifier: 'test-hash' })).rejects.toThrow(
        GravatarValidationError,
      );
    });
  });

  describe('getAvatarByEmail', () => {
    it('should handle valid email', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await getAvatarByEmailHandler({
        email: 'test@example.com',
        size: 100,
      });

      expect(utils.generateIdentifierFromEmail).toHaveBeenCalledWith('test@example.com');
      expect(fetch).toHaveBeenCalledWith(
        'https://gravatar.com/avatar/email-hash?s=100',
        expect.objectContaining({
          headers: expect.objectContaining({
            'User-Agent': 'mcp-server-gravatar/v1.0.0',
          }),
        }),
      );

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/png',
          },
        ],
      });
    });

    it('should validate email format', async () => {
      vi.mocked(utils.validateEmail).mockReturnValue(false);

      await expect(getAvatarByEmailHandler({ email: 'invalid-email' })).rejects.toThrow(
        GravatarValidationError,
      );
    });
  });
});
