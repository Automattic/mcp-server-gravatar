import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serverConfig, ApiConfigType, type ClientInfo } from '../../src/config/server-config.js';
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

    it('should be usable in conditional logic', () => {
      // Test that enum values can be used in conditional logic
      expect(ApiConfigType.RestApi === 0).toBe(true);
      expect(ApiConfigType.AvatarImageApi === 1).toBe(true);
      // Test that different enum values are different
      expect(ApiConfigType.RestApi).not.toBe(ApiConfigType.AvatarImageApi);
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

    it('should include client headers in configuration', async () => {
      // Test without client info
      const config1 = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config1.headers?.['X-Platform']).toBe('mcp-server-gravatar-stdio');
      expect(config1.headers?.['X-Source']).toBe('unknown-client');

      // Test with client info
      serverConfig.client.setInfo({ name: 'TestClient', version: '1.0.0' });
      const config2 = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config2.headers?.['X-Platform']).toBe('mcp-server-gravatar-stdio');
      expect(config2.headers?.['X-Source']).toBe('TestClient');
      expect(config2.headers?.['User-Agent']).toContain('(client: TestClient/1.0.0)');
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

  describe('Client Configuration', () => {
    beforeEach(() => {
      // Reset client info before each test by setting to null
      // We need to access the internal setClientInfo to set it to null
      // Since we can't directly set to null via the public API, we'll use a workaround
      serverConfig.client.setInfo({ name: '', version: '' });
      // Then we'll test the behavior with meaningful vs empty values
    });

    it('should expose client configuration properties', () => {
      expect(serverConfig).toHaveProperty('client');
      expect(serverConfig.client).toHaveProperty('setInfo');
      expect(serverConfig.client).toHaveProperty('info');
      expect(serverConfig.client).toHaveProperty('name');
      expect(serverConfig.client).toHaveProperty('version');
    });

    it('should store and retrieve client information', () => {
      const testClientInfo: ClientInfo = {
        name: 'TestClient',
        version: '2.1.0',
      };

      serverConfig.client.setInfo(testClientInfo);
      const retrieved = serverConfig.client.info;

      expect(retrieved).toEqual(testClientInfo);
      expect(retrieved?.name).toBe('TestClient');
      expect(retrieved?.version).toBe('2.1.0');
    });

    it('should provide fallback values for client name', () => {
      // Test with no client info set (empty values from beforeEach)
      expect(serverConfig.client.name).toBe('unknown-client');

      // Test with client info set
      serverConfig.client.setInfo({ name: 'Claude-Desktop', version: '1.0.0' });
      expect(serverConfig.client.name).toBe('Claude-Desktop');

      // Test with empty name
      serverConfig.client.setInfo({ name: '', version: '1.0.0' });
      expect(serverConfig.client.name).toBe('unknown-client');
    });

    it('should provide fallback values for client version', () => {
      // Test with no client info set (empty values from beforeEach)
      expect(serverConfig.client.version).toBe('unknown-version');

      // Test with client info set
      serverConfig.client.setInfo({ name: 'Claude-Desktop', version: '2.5.1' });
      expect(serverConfig.client.version).toBe('2.5.1');

      // Test with empty version
      serverConfig.client.setInfo({ name: 'Claude-Desktop', version: '' });
      expect(serverConfig.client.version).toBe('unknown-version');
    });

    it('should handle multiple client info updates', () => {
      // Set initial client info
      serverConfig.client.setInfo({ name: 'Client1', version: '1.0.0' });
      expect(serverConfig.client.name).toBe('Client1');
      expect(serverConfig.client.version).toBe('1.0.0');

      // Update client info
      serverConfig.client.setInfo({ name: 'Client2', version: '2.0.0' });
      expect(serverConfig.client.name).toBe('Client2');
      expect(serverConfig.client.version).toBe('2.0.0');

      // Verify the stored object is updated
      const info = serverConfig.client.info;
      expect(info?.name).toBe('Client2');
      expect(info?.version).toBe('2.0.0');
    });

    it('should handle client info with special characters', () => {
      const specialClientInfo: ClientInfo = {
        name: 'Test-Client_v2',
        version: '1.0.0-beta.1',
      };

      serverConfig.client.setInfo(specialClientInfo);
      expect(serverConfig.client.name).toBe('Test-Client_v2');
      expect(serverConfig.client.version).toBe('1.0.0-beta.1');
    });

    it('should enhance User-Agent with client info', () => {
      // Test without client info (empty strings from beforeEach)
      expect(serverConfig.userAgent).toContain('mcp-server-gravatar');
      expect(serverConfig.userAgent).not.toContain('(client:');

      // Test with client info
      serverConfig.client.setInfo({ name: 'TestClient', version: '1.0.0' });
      expect(serverConfig.userAgent).toContain('mcp-server-gravatar');
      expect(serverConfig.userAgent).toContain('(client: TestClient/1.0.0)');
    });

    it('should maintain client info independence from other config', () => {
      // Set client info
      serverConfig.client.setInfo({ name: 'TestClient', version: '1.0.0' });

      // Verify other config is unaffected
      expect(serverConfig.name).toBe('gravatar');
      expect(serverConfig.version).not.toBe('1.0.0'); // Should be the server version

      // Verify client info is separate
      expect(serverConfig.client.name).toBe('TestClient');
      expect(serverConfig.client.version).toBe('1.0.0');
    });
  });
});
