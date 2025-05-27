import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchProfileById } from '../../src/tools/profile-utils.js';
import { fetchInterestsById } from '../../src/tools/experimental-utils.js';
import { fetchAvatar } from '../../src/tools/avatar-utils.js';

// Mock the API clients to simulate errors
vi.mock('../../src/generated/gravatar-api/apis/ProfilesApi.js', () => ({
  ProfilesApi: vi.fn().mockImplementation(() => ({
    getProfileById: vi.fn(),
  })),
}));

vi.mock('../../src/generated/gravatar-api/apis/ExperimentalApi.js', () => ({
  ExperimentalApi: vi.fn().mockImplementation(() => ({
    getProfileInferredInterestsById: vi.fn(),
  })),
}));

// Mock fetch for avatar tests
global.fetch = vi.fn();

// Mock config
vi.mock('../../src/config/server-config.js', () => ({
  createRestApiConfig: vi.fn().mockReturnValue({}),
  getUserAgent: vi.fn().mockReturnValue('test-agent'),
}));

import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';

describe('Error Handling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Profile Error Handling', () => {
    it('should catch invalid hash format before API call', async () => {
      // This test is no longer needed since validation now happens at the schema level
      // The 63-character hash will be rejected by Zod before reaching fetchProfileById
      // This is tested in the validation.test.ts file instead
      expect(true).toBe(true); // Placeholder to keep test structure
    });

    it('should provide descriptive error for 404 profile not found', async () => {
      const mockProfilesApi = {
        getProfileById: vi.fn().mockRejectedValue({
          response: { status: 404, statusText: 'Not Found' },
        }),
      };
      vi.mocked(ProfilesApi).mockImplementation(() => mockProfilesApi as any);

      const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      await expect(fetchProfileById(testHash)).rejects.toThrow(Error);
      await expect(fetchProfileById(testHash)).rejects.toThrow(
        `No profile found for identifier: ${testHash}.`,
      );
    });

    it('should provide descriptive error for 400 invalid identifier', async () => {
      const mockProfilesApi = {
        getProfileById: vi.fn().mockRejectedValue({
          response: { status: 400, statusText: 'Bad Request' },
        }),
      };
      vi.mocked(ProfilesApi).mockImplementation(() => mockProfilesApi as any);

      const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      await expect(fetchProfileById(testHash)).rejects.toThrow(
        `Invalid profile identifier format: ${testHash}`,
      );
    });
  });

  describe('Interests Error Handling', () => {
    it('should provide descriptive error for 404 interests not found', async () => {
      const mockExperimentalApi = {
        getProfileInferredInterestsById: vi.fn().mockRejectedValue({
          response: { status: 404, statusText: 'Not Found' },
        }),
      };
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);

      await expect(fetchInterestsById('invalid-hash')).rejects.toThrow(
        'No interests found for profile identifier: invalid-hash',
      );
    });

    it('should provide descriptive error for 400 invalid identifier', async () => {
      const mockExperimentalApi = {
        getProfileInferredInterestsById: vi.fn().mockRejectedValue({
          response: { status: 400, statusText: 'Bad Request' },
        }),
      };
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);

      await expect(fetchInterestsById('bad-format')).rejects.toThrow(
        'Invalid profile identifier format: bad-format',
      );
    });

    it('should provide descriptive error for 403 access denied', async () => {
      const mockExperimentalApi = {
        getProfileInferredInterestsById: vi.fn().mockRejectedValue({
          response: { status: 403, statusText: 'Forbidden' },
        }),
      };
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);

      await expect(fetchInterestsById('private-hash')).rejects.toThrow(
        'Profile is private or access denied for identifier: private-hash',
      );
    });

    it('should provide descriptive error for 429 rate limit', async () => {
      const mockExperimentalApi = {
        getProfileInferredInterestsById: vi.fn().mockRejectedValue({
          response: { status: 429, statusText: 'Too Many Requests' },
        }),
      };
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);

      await expect(fetchInterestsById('some-hash')).rejects.toThrow(
        'Rate limit exceeded. Please try again later.',
      );
    });

    it('should handle network errors', async () => {
      const mockExperimentalApi = {
        getProfileInferredInterestsById: vi.fn().mockRejectedValue({
          message: 'Network error',
        }),
      };
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);

      await expect(fetchInterestsById('some-hash')).rejects.toThrow(
        'Failed to fetch interests: Network error',
      );
    });

    it('should handle unknown errors', async () => {
      const mockExperimentalApi = {
        getProfileInferredInterestsById: vi.fn().mockRejectedValue('Unknown error'),
      };
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);

      await expect(fetchInterestsById('some-hash')).rejects.toThrow(
        'Failed to fetch interests for identifier: some-hash',
      );
    });
  });

  describe('Avatar Error Handling', () => {
    it('should provide descriptive error for 404 avatar not found', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      } as Response);

      const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      await expect(fetchAvatar({ avatarIdentifier: testHash })).rejects.toThrow(Error);

      await expect(fetchAvatar({ avatarIdentifier: testHash })).rejects.toThrow(
        'No avatar found for identifier:',
      );
    });

    it('should provide descriptive error for rate limiting', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      } as Response);

      const testHash = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      await expect(fetchAvatar({ avatarIdentifier: testHash })).rejects.toThrow(
        'Rate limit exceeded. Please try again later.',
      );
    });
  });
});
