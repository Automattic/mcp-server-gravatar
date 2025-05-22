import { createMockProfilesApi, createMockExperimentalApi } from './mock-api-clients';
import { AvatarImageApi } from '../../src/apis/avatar-image-api';

/**
 * Creates a mock API client for testing
 */
export function createTestApiClient() {
  return {
    profiles: createMockProfilesApi(),
    experimental: createMockExperimentalApi(),
    avatars: new AvatarImageApi(),
  };
}
