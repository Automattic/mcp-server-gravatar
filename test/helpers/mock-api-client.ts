import { vi } from 'vitest';
import type { ApiClient } from '../../src/apis/api-client';
import { createMockAvatarBuffer } from './mock-responses';
import type { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi';
import type { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi';
import type { AvatarImageApi } from '../../src/apis/avatar-image-api';

/**
 * Creates a mock API client for testing
 */
export function createMockApiClient(options?: { mockAvatarBuffer?: Buffer }): Partial<ApiClient> {
  const mockAvatarBuffer = options?.mockAvatarBuffer || createMockAvatarBuffer(10);

  // Create partial mocks that only implement the methods we need
  const mockProfilesApi = {
    getProfileById: vi.fn().mockResolvedValue({
      hash: 'test-hash',
      displayName: 'Test User',
      profileUrl: 'https://gravatar.com/testuser',
    }),
  } as unknown as ProfilesApi;

  const mockExperimentalApi = {
    getProfileInferredInterestsById: vi.fn().mockResolvedValue([
      { name: 'programming', confidence: 0.9 },
      { name: 'javascript', confidence: 0.8 },
    ]),
  } as unknown as ExperimentalApi;

  const mockAvatarImageApi = {
    getAvatarById: vi.fn().mockResolvedValue(mockAvatarBuffer),
  } as unknown as AvatarImageApi;

  return {
    profiles: mockProfilesApi,
    experimental: mockExperimentalApi,
    avatars: mockAvatarImageApi,
  };
}
