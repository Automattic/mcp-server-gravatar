import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  config,
  createRestApiConfig,
  createAvatarApiConfig,
  setClientInfo,
  getUserAgent,
} from '../../src/config/server-config.js';
import { Configuration } from '../../src/generated/gravatar-api/runtime.js';

describe('Server Configuration', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...originalEnv };
    delete process.env.GRAVATAR_API_KEY;
    // Reset client info
    setClientInfo('', '');
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe('API Configuration Creation', () => {
    it('should create correct configurations for different API types', async () => {
      // Test REST API config
      const restConfig = createRestApiConfig();
      expect(restConfig).toBeInstanceOf(Configuration);
      expect(restConfig.basePath).toBe('https://api.gravatar.com/v3');
      expect(restConfig.headers?.['User-Agent']).toContain('mcp-server-gravatar');

      // Test Avatar API config
      const avatarConfig = createAvatarApiConfig();
      expect(avatarConfig).toBeInstanceOf(Configuration);
      expect(avatarConfig.basePath).toBe('https://gravatar.com/avatar');
      expect(avatarConfig.headers?.['User-Agent']).toContain('mcp-server-gravatar');

      // Both should have same User-Agent
      expect(restConfig.headers?.['User-Agent']).toBe(avatarConfig.headers?.['User-Agent']);
    });

    it('should handle API key configuration', async () => {
      // Test without API key
      const configWithoutKey = createRestApiConfig();
      expect(configWithoutKey.accessToken).toBeUndefined();

      // Test with API key
      process.env.GRAVATAR_API_KEY = 'test-api-key';
      const configWithKey = createRestApiConfig();
      expect(typeof configWithKey.accessToken).toBe('function');

      if (configWithKey.accessToken) {
        const token = await configWithKey.accessToken();
        expect(token).toBe('test-api-key');
      }
    });

    it('should include client headers in configuration', async () => {
      // Test with client info
      setClientInfo('TestClient', '1.0.0');
      const restConfig = createRestApiConfig();

      expect(restConfig.headers?.['X-Platform']).toBe('mcp-server-gravatar-stdio');
      expect(restConfig.headers?.['X-Source']).toBe('TestClient');
      expect(restConfig.headers?.['User-Agent']).toContain('(client: TestClient/1.0.0)');
    });
  });

  describe('Client Information Management', () => {
    it('should store and retrieve client information with fallbacks', () => {
      // Test fallback values
      expect(config.clientName).toBe('unknown-client');
      expect(config.clientVersion).toBe('unknown-version');

      // Test setting and retrieving client info
      setClientInfo('TestClient', '2.1.0');

      expect(config.clientName).toBe('TestClient');
      expect(config.clientVersion).toBe('2.1.0');

      // Test empty values fall back to defaults
      setClientInfo('', '');
      expect(config.clientName).toBe('unknown-client');
      expect(config.clientVersion).toBe('unknown-version');
    });

    it('should enhance User-Agent with client info', () => {
      // Test without client info
      expect(getUserAgent()).toContain('mcp-server-gravatar');
      expect(getUserAgent()).not.toContain('(client:');

      // Test with client info
      setClientInfo('TestClient', '1.0.0');
      expect(getUserAgent()).toContain('mcp-server-gravatar');
      expect(getUserAgent()).toContain('(client: TestClient/1.0.0)');
    });
  });

  describe('Server Properties', () => {
    it('should have correct basic configuration', () => {
      expect(config.name).toBe('gravatar');
      expect(config.description).toBe('MCP Server for Gravatar API');
      expect(typeof config.version).toBe('string');
      expect(config.avatarApiBase).toBe('https://gravatar.com/avatar');
    });

    it('should handle security configuration correctly', async () => {
      // Test without API key
      delete process.env.GRAVATAR_API_KEY;
      expect(config.apiKey).toBeUndefined();

      // Test with API key
      process.env.GRAVATAR_API_KEY = 'test-key';
      expect(config.apiKey).toBe('test-key');
    });
  });
});
