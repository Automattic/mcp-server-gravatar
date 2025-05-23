import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { serverConfig, ApiConfigType } from '../../src/config/server-config.js';
import { Configuration } from '../../src/generated/gravatar-api/runtime.js';

describe('Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GRAVATAR_API_KEY;
    // Reset client info
    serverConfig.client.setInfo({ name: '', version: '' });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('API Configuration Creation', () => {
    it('should create correct configurations for different API types', async () => {
      // Test REST API config
      const restConfig = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);
      expect(restConfig).toBeInstanceOf(Configuration);
      expect(restConfig.basePath).toBe('https://api.gravatar.com/v3');
      expect(restConfig.headers?.['User-Agent']).toContain('mcp-server-gravatar');

      // Test Avatar API config
      const avatarConfig = await serverConfig.createApiConfiguration(ApiConfigType.AvatarImageApi);
      expect(avatarConfig).toBeInstanceOf(Configuration);
      expect(avatarConfig.basePath).toBe('https://gravatar.com/avatar');
      expect(avatarConfig.headers?.['User-Agent']).toContain('mcp-server-gravatar');

      // Both should have same User-Agent
      expect(restConfig.headers?.['User-Agent']).toBe(avatarConfig.headers?.['User-Agent']);
    });

    it('should handle API key configuration', async () => {
      // Test without API key
      const configWithoutKey = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);
      expect(configWithoutKey.accessToken).toBeUndefined();

      // Test with API key
      process.env.GRAVATAR_API_KEY = 'test-api-key';
      const configWithKey = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);
      expect(typeof configWithKey.accessToken).toBe('function');

      if (configWithKey.accessToken) {
        const token = await configWithKey.accessToken();
        expect(token).toBe('test-api-key');
      }
    });

    it('should include client headers in configuration', async () => {
      // Test with client info
      serverConfig.client.setInfo({ name: 'TestClient', version: '1.0.0' });
      const config = await serverConfig.createApiConfiguration(ApiConfigType.RestApi);

      expect(config.headers?.['X-Platform']).toBe('mcp-server-gravatar-stdio');
      expect(config.headers?.['X-Source']).toBe('TestClient');
      expect(config.headers?.['User-Agent']).toContain('(client: TestClient/1.0.0)');
    });
  });

  describe('Client Information Management', () => {
    it('should store and retrieve client information with fallbacks', () => {
      // Test fallback values
      expect(serverConfig.client.name).toBe('unknown-client');
      expect(serverConfig.client.version).toBe('unknown-version');

      // Test setting and retrieving client info
      const testClientInfo = { name: 'TestClient', version: '2.1.0' };
      serverConfig.client.setInfo(testClientInfo);

      expect(serverConfig.client.info).toEqual(testClientInfo);
      expect(serverConfig.client.name).toBe('TestClient');
      expect(serverConfig.client.version).toBe('2.1.0');

      // Test empty values fall back to defaults
      serverConfig.client.setInfo({ name: '', version: '' });
      expect(serverConfig.client.name).toBe('unknown-client');
      expect(serverConfig.client.version).toBe('unknown-version');
    });

    it('should enhance User-Agent with client info', () => {
      // Test without client info
      expect(serverConfig.userAgent).toContain('mcp-server-gravatar');
      expect(serverConfig.userAgent).not.toContain('(client:');

      // Test with client info
      serverConfig.client.setInfo({ name: 'TestClient', version: '1.0.0' });
      expect(serverConfig.userAgent).toContain('mcp-server-gravatar');
      expect(serverConfig.userAgent).toContain('(client: TestClient/1.0.0)');
    });
  });

  describe('Server Properties', () => {
    it('should have correct basic configuration', () => {
      expect(serverConfig.name).toBe('gravatar');
      expect(serverConfig.description).toBe('MCP Server for Gravatar API');
      expect(typeof serverConfig.version).toBe('string');
      expect(serverConfig.api.avatarBaseUrl).toBe('https://gravatar.com/avatar');
      expect(serverConfig.security.apiKeyEnvVar).toBe('GRAVATAR_API_KEY');
    });

    it('should handle security configuration correctly', async () => {
      // Test without API key
      delete process.env.GRAVATAR_API_KEY;
      let apiKey = await serverConfig.security.apiKey;
      expect(apiKey).toBeUndefined();

      // Test with API key
      process.env.GRAVATAR_API_KEY = 'test-key';
      apiKey = await serverConfig.security.apiKey;
      expect(apiKey).toBe('test-key');
    });
  });
});
