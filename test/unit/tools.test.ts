import { describe, it, expect, vi, beforeEach } from 'vitest';
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
    generateIdentifier: vi.fn(),
  };
});

import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';
import * as utils from '../../src/common/utils.js';

describe('Tools Index', () => {
  it('should export all tools', () => {
    const tools = [
      getProfileByIdTool,
      getProfileByEmailTool,
      getInterestsByIdTool,
      getInterestsByEmailTool,
      getAvatarByIdTool,
      getAvatarByEmailTool,
    ];

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
    vi.mocked(utils.generateIdentifier).mockReturnValue('email-hash');
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
        structuredContent: mockProfile,
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

      expect(utils.generateIdentifier).toHaveBeenCalledWith('test@example.com');
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
        structuredContent: mockProfile,
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
    vi.mocked(utils.generateIdentifier).mockReturnValue('email-hash');
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

      const expectedStructuredResponse = { inferredInterests: mockInterests };

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(expectedStructuredResponse, null, 2),
          },
        ],
        structuredContent: expectedStructuredResponse,
      });
    });
  });

  describe('handleGetInterestsByEmail', () => {
    it('should handle valid email', async () => {
      const mockInterests = [{ name: 'typescript' }, { name: 'react' }];

      mockExperimentalApi.getProfileInferredInterestsById.mockResolvedValue(mockInterests);

      const result = await handleGetInterestsByEmail({ email: 'test@example.com' });

      expect(utils.generateIdentifier).toHaveBeenCalledWith('test@example.com');
      expect(mockExperimentalApi.getProfileInferredInterestsById).toHaveBeenCalledWith({
        profileIdentifier: 'email-hash',
      });

      const expectedStructuredResponse = { inferredInterests: mockInterests };

      expect(result).toEqual({
        content: [
          {
            type: 'text',
            text: JSON.stringify(expectedStructuredResponse, null, 2),
          },
        ],
        structuredContent: expectedStructuredResponse,
      });
    });
  });
});

describe('Avatar Tools', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(utils.generateIdentifier).mockReturnValue('email-hash');
  });

  describe('handleGetAvatarById', () => {
    it('should handle valid avatar ID with PNG content-type', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarById({
        avatarIdentifier: validHash,
        size: 200,
        defaultOption: 'identicon',
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

    it('should handle valid avatar ID with JPEG content-type', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/jpeg'),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarById({
        avatarIdentifier: validHash,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/jpeg',
          },
        ],
      });
    });

    it('should handle valid avatar ID with GIF content-type', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/gif'),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarById({
        avatarIdentifier: validHash,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/gif',
          },
        ],
      });
    });

    it('should handle valid email with WebP content-type', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/webp'),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarByEmail({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/webp',
          },
        ],
      });
    });

    it('should fallback to image/png when content-type header is missing', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue(null), // No content-type header
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarById({
        avatarIdentifier: validHash,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/png', // Should fallback to PNG
          },
        ],
      });
    });

    it('should fallback to image/png when content-type is not an image', async () => {
      const validHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('text/html'), // Invalid content-type for image
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarById({
        avatarIdentifier: validHash,
      });

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/png', // Should fallback to PNG
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
    it('should handle valid email with PNG content-type', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue('image/png'),
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarByEmail({
        email: 'test@example.com',
        size: 100,
      });

      expect(utils.generateIdentifier).toHaveBeenCalledWith('test@example.com');
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

    it('should fallback to image/png when content-type header is missing', async () => {
      const mockArrayBuffer = new ArrayBuffer(8);
      const mockResponse = {
        ok: true,
        headers: {
          get: vi.fn().mockReturnValue(null), // No content-type header
        },
        arrayBuffer: vi.fn().mockResolvedValue(mockArrayBuffer),
      };

      vi.mocked(fetch).mockResolvedValue(mockResponse as any);

      const result = await handleGetAvatarByEmail({
        email: 'test@example.com',
      });

      expect(result).toEqual({
        content: [
          {
            type: 'image',
            data: Buffer.from(mockArrayBuffer).toString('base64'),
            mimeType: 'image/png', // Should fallback to PNG
          },
        ],
      });
    });
  });
});
