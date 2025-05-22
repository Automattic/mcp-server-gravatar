import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from '../../src/apis/api-client.js';
import * as utils from '../../src/common/utils.js';
import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';
import { AvatarImageApi } from '../../src/apis/avatar-image-api.js';

// Mock the utils functions
vi.mock('../../src/common/utils.js', async () => {
  const actual = await vi.importActual('../../src/common/utils.js');
  return {
    ...actual,
    createApiConfiguration: vi.fn().mockResolvedValue({
      basePath: 'https://api.example.com',
    } as any),
  };
});

// Mock the API classes
vi.mock('../../src/generated/gravatar-api/apis/ProfilesApi.js', () => ({
  ProfilesApi: vi.fn(),
}));

vi.mock('../../src/generated/gravatar-api/apis/ExperimentalApi.js', () => ({
  ExperimentalApi: vi.fn(),
}));

vi.mock('../../src/apis/avatar-image-api.js', () => ({
  AvatarImageApi: vi.fn(),
}));

describe('API Client', () => {
  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('createApiClient', () => {
    it('should create an object with the expected structure', async () => {
      // Setup mocks
      const mockProfilesApi = {};
      const mockExperimentalApi = {};
      const mockAvatarImageApi = {};

      vi.mocked(ProfilesApi).mockImplementation(() => mockProfilesApi as any);
      vi.mocked(ExperimentalApi).mockImplementation(() => mockExperimentalApi as any);
      vi.mocked(AvatarImageApi).mockImplementation(() => mockAvatarImageApi as any);

      // Call the function
      const client = await createApiClient();

      // Verify the result
      expect(client).toHaveProperty('profiles');
      expect(client).toHaveProperty('experimental');
      expect(client).toHaveProperty('avatars');

      expect(client.profiles).toBe(mockProfilesApi);
      expect(client.experimental).toBe(mockExperimentalApi);
      expect(client.avatars).toBe(mockAvatarImageApi);
    });

    it('should configure the API clients correctly', async () => {
      // Setup mocks
      const mockConfig = {
        basePath: 'https://api.example.com',
      } as any;
      vi.mocked(utils.createApiConfiguration).mockResolvedValue(mockConfig);

      // Call the function
      await createApiClient();

      // Verify the configuration was used
      expect(utils.createApiConfiguration).toHaveBeenCalled();
      expect(ProfilesApi).toHaveBeenCalledWith(mockConfig);
      expect(ExperimentalApi).toHaveBeenCalledWith(mockConfig);
      expect(AvatarImageApi).toHaveBeenCalled();
    });
  });
});
