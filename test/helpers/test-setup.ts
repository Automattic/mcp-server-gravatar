import { ProfileService } from '../../src/services/profile-service';
import { ExperimentalService } from '../../src/services/experimental-service';
import { GravatarImageService } from '../../src/services/gravatar-image-service';
import {
  createMockProfilesApi,
  createMockExperimentalApi,
  createMockFetch,
} from './mock-api-clients';
import type {
  IProfileService,
  IExperimentalService,
  IGravatarImageService,
} from '../../src/services/interfaces';

/**
 * Creates a ProfileService with mocked dependencies for testing
 */
export function createTestProfileService(options?: {
  mockProfilesApi?: ReturnType<typeof createMockProfilesApi>;
}): IProfileService {
  const mockProfilesApiClient = options?.mockProfilesApi || createMockProfilesApi();
  return new ProfileService(mockProfilesApiClient);
}

/**
 * Creates an ExperimentalService with mocked dependencies for testing
 */
export function createTestExperimentalService(options?: {
  mockExperimentalApi?: ReturnType<typeof createMockExperimentalApi>;
}): IExperimentalService {
  const mockExperimentalApiClient = options?.mockExperimentalApi || createMockExperimentalApi();
  return new ExperimentalService(mockExperimentalApiClient);
}

/**
 * Creates a GravatarImageService with mocked dependencies for testing
 */
export function createTestGravatarImageService(options?: {
  mockFetch?: ReturnType<typeof createMockFetch>;
}): IGravatarImageService {
  const mockGravatarImageApiClient = options?.mockFetch || createMockFetch();
  return new GravatarImageService(mockGravatarImageApiClient);
}
