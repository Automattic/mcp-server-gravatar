import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient } from '../../src/apis/api-client.js';
import { ProfilesApi } from '../../src/generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../src/generated/gravatar-api/apis/ExperimentalApi.js';
import { AvatarImageApi } from '../../src/apis/avatar-image-api.js';

// Mock the server config
vi.mock('../../src/config/server-config.js', () => ({
  ApiConfigType: {
    RestApi: 0,
    AvatarImageApi: 1,
  },
  serverConfig: {
    createApiConfiguration: vi.fn(),
  },
}));

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

      const { serverConfig } = await import('../../src/config/server-config.js');
      vi.mocked(serverConfig.createApiConfiguration).mockResolvedValue({
        basePath: 'https://api.example.com',
        headers: { 'User-Agent': 'test' },
      } as any);

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

    it('should configure the API clients correctly with parallel configuration creation', async () => {
      // Setup mocks
      const mockRestConfig = {
        basePath: 'https://api.gravatar.com/v3',
        headers: { 'User-Agent': 'mcp-server-gravatar/v1.0.0' },
      } as any;

      const mockAvatarConfig = {
        basePath: 'https://gravatar.com/avatar',
        headers: { 'User-Agent': 'mcp-server-gravatar/v1.0.0' },
      } as any;

      const { serverConfig, ApiConfigType } = await import('../../src/config/server-config.js');
      vi.mocked(serverConfig.createApiConfiguration)
        .mockResolvedValueOnce(mockRestConfig) // First call (RestApi)
        .mockResolvedValueOnce(mockAvatarConfig); // Second call (AvatarImageApi)

      // Call the function
      await createApiClient();

      // Verify the configuration was used correctly
      expect(serverConfig.createApiConfiguration).toHaveBeenCalledTimes(2);
      expect(serverConfig.createApiConfiguration).toHaveBeenNthCalledWith(1, ApiConfigType.RestApi);
      expect(serverConfig.createApiConfiguration).toHaveBeenNthCalledWith(
        2,
        ApiConfigType.AvatarImageApi,
      );

      // Verify each API gets the correct configuration
      expect(ProfilesApi).toHaveBeenCalledWith(mockRestConfig);
      expect(ExperimentalApi).toHaveBeenCalledWith(mockRestConfig);
      expect(AvatarImageApi).toHaveBeenCalledWith(mockAvatarConfig);
    });
  });
});
