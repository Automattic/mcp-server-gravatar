import { vi } from 'vitest';
import type { ApiClient } from '../../src/apis/api-client';
import { createMockAvatarBuffer } from './mock-responses';
import type { IProfilesApiClient, IExperimentalApiClient } from '../../src/apis/interfaces';
import type { AvatarImageApi } from '../../src/apis/avatar-image-api';

/**
 * Creates a mock API client for testing
 */
export function createMockApiClient(options?: {
  // Existing option
  mockAvatarBuffer?: Buffer;

  // New options for custom implementations
  profilesGetProfileByIdImpl?: ReturnType<typeof vi.fn>;
  experimentalGetProfileInferredInterestsByIdImpl?: ReturnType<typeof vi.fn>;
  avatarsGetAvatarByIdImpl?: ReturnType<typeof vi.fn>;
}): Partial<ApiClient> {
  const mockAvatarBuffer = options?.mockAvatarBuffer || createMockAvatarBuffer(10);

  // Create partial mocks that only implement the methods we need
  const mockProfilesApi = {
    getProfileById:
      options?.profilesGetProfileByIdImpl ||
      vi.fn().mockResolvedValue({
        hash: 'test-hash',
        displayName: 'Test User',
        profileUrl: 'https://gravatar.com/testuser',
      }),
  } as unknown as IProfilesApiClient;

  const mockExperimentalApi = {
    getProfileInferredInterestsById:
      options?.experimentalGetProfileInferredInterestsByIdImpl ||
      vi.fn().mockResolvedValue([
        { name: 'programming', confidence: 0.9 },
        { name: 'javascript', confidence: 0.8 },
      ]),
  } as unknown as IExperimentalApiClient;

  const mockAvatarImageApi = {
    getAvatarById: options?.avatarsGetAvatarByIdImpl || vi.fn().mockResolvedValue(mockAvatarBuffer),
  } as unknown as AvatarImageApi;

  return {
    profiles: mockProfilesApi,
    experimental: mockExperimentalApi,
    avatars: mockAvatarImageApi,
  };
}
