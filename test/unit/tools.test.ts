import { describe, it, expect, vi, beforeEach } from 'vitest';
import { tools } from '../../src/tools/index.js';
import { getProfileByIdTool, handleGetProfileById } from '../../src/tools/get-profile-by-id.js';
import {
  getProfileByEmailTool,
  handleGetProfileByEmail,
} from '../../src/tools/get-profile-by-email.js';
import {
  getInterestsByIdTool,
  handleGetInterestsById,
} from '../../src/tools/get-interests-by-id.js';
import {
  getInterestsByEmailTool,
  handleGetInterestsByEmail,
} from '../../src/tools/get-interests-by-email.js';
import { getAvatarByIdTool, handleGetAvatarById } from '../../src/tools/get-avatar-by-id.js';
import {
  getAvatarByEmailTool,
  handleGetAvatarByEmail,
} from '../../src/tools/get-avatar-by-email.js';
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

  describe('handleGetProfileById', () => {
    it('should handle valid profile ID', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockProfile = {
        hash: validHash,
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      };

      mockProfilesApi.getProfileById.mockResolvedValue(mockProfile);

      const result = await handleGetProfileById({ profileIdentifier: validHash });

      expect(mockProfilesApi.getProfileById).toHaveBeenCalledWith({
        profileIdentifier: validHash,
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
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      mockProfilesApi.getProfileById.mockRejectedValue(new Error('API Error'));

      const result = (await handleGetProfileById({ profileIdentifier: validHash })) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Failed to fetch profile for identifier');
    });
  });

  describe('handleGetProfileByEmail', () => {
    it('should handle valid email', async () => {
      const mockProfile = {
        hash: 'email-hash',
        displayName: 'Email User',
        profileUrl: 'https://gravatar.com/emailuser',
      };

      mockProfilesApi.getProfileById.mockResolvedValue(mockProfile);

      const result = await handleGetProfileByEmail({ email: 'test@example.com' });

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

  describe('handleGetInterestsById', () => {
    it('should handle valid profile ID', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockInterests = [{ name: 'programming' }, { name: 'javascript' }];

      mockExperimentalApi.getProfileInferredInterestsById.mockResolvedValue(mockInterests);

      const result = await handleGetInterestsById({ profileIdentifier: validHash });

      expect(mockExperimentalApi.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: validHash,
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
  });

  describe('handleGetInterestsByEmail', () => {
    it('should handle valid email', async () => {
      const mockInterests = [{ name: 'typescript' }, { name: 'react' }];

      mockExperimentalApi.getProfileInferredInterestsById.mockResolvedValue(mockInterests);

      const result = await handleGetInterestsByEmail({ email: 'test@example.com' });

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
  });
});

describe('Avatar Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(utils.validateHash).mockReturnValue(true);
    vi.mocked(utils.validateEmail).mockReturnValue(true);
    vi.mocked(utils.generateIdentifierFromEmail).mockReturnValue('email-hash');
  });

  describe('handleGetAvatarById', () => {
    it('should handle valid avatar ID', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarById({
        avatarIdentifier: validHash,
        size: 200,
        defaultOption: DefaultAvatarOption.IDENTICON,
      });

      expect(fetch).toHaveBeenCalledWith(
        `https://gravatar.com/avatar/${validHash}?s=200&d=identicon`,
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

    it('should handle fetch errors', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockResponse = {
        ok: false,
        statusText: 'Not Found',
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = (await handleGetAvatarById({ avatarIdentifier: validHash })) as any;

      expect(result.isError).toBe(true);
      expect(result.content[0].type).toBe('text');
      expect(result.content[0].text).toContain('Failed to fetch avatar for identifier');
    });
  });

  describe('handleGetAvatarByEmail', () => {
    it('should handle valid email', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarByEmail({
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
  });
});
