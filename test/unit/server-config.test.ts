import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serverConfig, ApiConfigType } from '../../src/config/server-config.js';
import { Configuration } from '../../src/generated/gravatar-api/runtime.js';

describe('Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GRAVATAR_API_KEY;
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('ApiConfigType enum', () => {
    it('should have consistent numeric values', () => {
      expect(ApiConfigType.RestApi).toBe(0);
      expect(ApiConfigType.AvatarImageApi).toBe(1);
    });

    it('should work with switch statements', () => {
      // Test with a variable to avoid TypeScript comparison errors
      const testRestApi = ApiConfigType.RestApi;
      const testAvatarApi = ApiConfigType.AvatarImageApi;

      let result: string;

      switch (testRestApi) {
        case ApiConfigType.RestApi:
          result = 'rest';
          break;
        case ApiConfigType.AvatarImageApi:
          result = 'avatar';
          break;
        default:
          result = 'unknown';
      }

      expect(result).toBe('rest');

      switch (testAvatarApi) {
        case ApiConfigType.RestApi:
          result = 'rest';
          break;
        case ApiConfigType.AvatarImageApi:
          result = 'avatar';
          break;
        default:
          result = 'unknown';
      }

      expect(result).toBe('avatar');
    });
  });

  describe('createApiConfiguration', () => {
    it('should create REST API config with default basePath', async () => {
      const config = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config).toBeInstanceOf(Configuration);
      expect(config.basePath).toBe('https://api.gravatar.com/v3'); // Configuration class default
      expect(config.headers).toBeDefined();
      expect(config.headers?.['User-Agent']).toContain('mcp-server-gravatar');
    });

    it('should create Avatar API config with avatar basePath', async () => {
      const config = await serverConfig.createApiConfiguration(ApiConfigType.AvatarImageApi);

      expect(config).toBeInstanceOf(Configuration);
      expect(config.basePath).toBe('https://gravatar.com/avatar');
      expect(config.headers).toBeDefined();
      expect(config.headers?.['User-Agent']).toContain('mcp-server-gravatar');
    });

    it('should include API key when present', async () => {
      process.env.GRAVATAR_API_KEY = 'test-api-key';

      const config = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config).toBeInstanceOf(Configuration);
      expect(typeof config.accessToken).toBe('function');

      // Test that the accessToken function returns the API key
      if (config.accessToken) {
        const token = await config.accessToken();
        expect(token).toBe('test-api-key');
      }
    });

    it('should handle missing API key gracefully', async () => {
      delete process.env.GRAVATAR_API_KEY;

      const config = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config).toBeInstanceOf(Configuration);
      expect(config.accessToken).toBeUndefined();
    });

    it('should include User-Agent header for all config types', async () => {
      const restConfig = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);
      const avatarConfig = await serverConfig.createApiConfiguration(ApiConfigType.AvatarImageApi);

      expect(restConfig.headers?.['User-Agent']).toContain('mcp-server-gravatar');
      expect(avatarConfig.headers?.['User-Agent']).toContain('mcp-server-gravatar');

      // Both should have the same User-Agent
      expect(restConfig.headers?.['User-Agent']).toBe(avatarConfig.headers?.['User-Agent']);
    });

    it('should handle invalid enum values gracefully', async () => {
      // Test with an invalid enum value (cast to bypass TypeScript checking)
      const invalidType = 999 as ApiConfigType;

      const config = await serverConfig.createApiConfiguration(invalidType);

      // Should default to REST API behavior
      expect(config).toBeInstanceOf(Configuration);
      expect(config.basePath).toBe('https://api.gravatar.com/v3'); // Uses default behavior
      expect(config.headers?.['User-Agent']).toContain('mcp-server-gravatar');
    });
  });

  describe('serverConfig object', () => {
    it('should expose correct properties', () => {
      expect(serverConfig).toHaveProperty('name');
      expect(serverConfig).toHaveProperty('version');
      expect(serverConfig).toHaveProperty('description');
      expect(serverConfig).toHaveProperty('capabilities');
      expect(serverConfig).toHaveProperty('api');
      expect(serverConfig).toHaveProperty('security');
      expect(serverConfig).toHaveProperty('userAgent');
      expect(serverConfig).toHaveProperty('createApiConfiguration');
    });

    it('should have correct basic info', () => {
      expect(serverConfig.name).toBe('gravatar');
      expect(serverConfig.description).toBe('MCP Server for Gravatar API');
      expect(typeof serverConfig.version).toBe('string');
    });

    it('should have working userAgent getter', () => {
      const userAgent = serverConfig.userAgent;
      expect(typeof userAgent).toBe('string');
      expect(userAgent).toContain('mcp-server-gravatar');
      expect(userAgent).toContain('v');
    });

    it('should have correct API configuration', () => {
      expect(serverConfig.api).toHaveProperty('avatarBaseUrl');
      expect(serverConfig.api.avatarBaseUrl).toBe('https://gravatar.com/avatar');
    });

    it('should have correct security configuration', () => {
      expect(serverConfig.security).toHaveProperty('apiKeyEnvVar');
      expect(serverConfig.security).toHaveProperty('apiKey');
      expect(serverConfig.security.apiKeyEnvVar).toBe('GRAVATAR_API_KEY');
      expect(typeof serverConfig.security.apiKey).toBe('object'); // It's a getter, not a function
    });

    it('should have working security.apiKey getter', async () => {
      // Test without API key
      delete process.env.GRAVATAR_API_KEY;
      let apiKey = await serverConfig.security.apiKey;
      expect(apiKey).toBeUndefined();

      // Test with API key
      process.env.GRAVATAR_API_KEY = 'test-key';
      apiKey = await serverConfig.security.apiKey;
      expect(apiKey).toBe('test-key');
    });

    it('should respect custom API key environment variable name', async () => {
      process.env.GRAVATAR_API_KEY_ENV_VAR = 'CUSTOM_API_KEY';
      process.env.CUSTOM_API_KEY = 'custom-test-key';

      // Need to re-import to pick up the new environment variable
      vi.resetModules();
      const { serverConfig: newServerConfig } = await import('../../src/config/server-config.js');

      expect(newServerConfig.security.apiKeyEnvVar).toBe('CUSTOM_API_KEY');
      const apiKey = await newServerConfig.security.apiKey;
      expect(apiKey).toBe('custom-test-key');
    });
  });

  describe('configuration consistency', () => {
    it('should create different configurations for different API types', async () => {
      const restConfig = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);
      const avatarConfig = await serverConfig.createApiConfiguration(ApiConfigType.AvatarImageApi);

      // Should have different basePath
      expect(restConfig.basePath).toBe('https://api.gravatar.com/v3');
      expect(avatarConfig.basePath).toBe('https://gravatar.com/avatar');

      // Should have same User-Agent
      expect(restConfig.headers?.['User-Agent']).toBe(avatarConfig.headers?.['User-Agent']);

      // Should have same API key behavior
      expect(typeof restConfig.accessToken).toBe(typeof avatarConfig.accessToken);
    });

    it('should create consistent configurations when called multiple times', async () => {
      const config1 = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);
      const config2 = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config1.basePath).toBe(config2.basePath);
      expect(config1.headers?.['User-Agent']).toBe(config2.headers?.['User-Agent']);
      expect(typeof config1.accessToken).toBe(typeof config2.accessToken);
    });
  });
});
