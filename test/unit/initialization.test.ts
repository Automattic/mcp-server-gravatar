import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import server from '../../src/index.js';
import { serverConfig } from '../../src/config/server-config.js';

describe('MCP Server Initialization', () => {
  beforeEach(() => {
    // Reset client info before each test
    serverConfig.client.setInfo({ name: '', version: '' });

    // Mock console.error to avoid noise in tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should handle initialization request with client info', async () => {
    const initializeRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true,
          },
        },
        clientInfo: {
          name: 'TestClient',
          version: '1.2.3',
        },
      },
    };

    // Get the handler for the initialize request
    const handlers = (server as any)._requestHandlers;
    const initializeHandler = handlers.get('initialize');

    expect(initializeHandler).toBeDefined();

    // Call the handler
    const response = await initializeHandler(initializeRequest);

    // Verify response structure
    expect(response).toHaveProperty('protocolVersion');
    expect(response).toHaveProperty('capabilities');
    expect(response).toHaveProperty('serverInfo');

    expect(response.protocolVersion).toBe('2024-11-05');
    expect(response.serverInfo.name).toBe('gravatar');
    expect(typeof response.serverInfo.version).toBe('string');

    // Verify client info was stored
    expect(serverConfig.client.name).toBe('TestClient');
    expect(serverConfig.client.version).toBe('1.2.3');
    expect(serverConfig.client.info).toEqual({
      name: 'TestClient',
      version: '1.2.3',
    });

    // Verify console log was called
    expect(console.error).toHaveBeenCalledWith('MCP Client connected: TestClient v1.2.3');
  });

  it('should handle initialization request with empty client info', async () => {
    const initializeRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {
          roots: {
            listChanged: true,
          },
        },
        clientInfo: {
          name: '',
          version: '',
        },
      },
    };

    // Get the handler for the initialize request
    const handlers = (server as any)._requestHandlers;
    const initializeHandler = handlers.get('initialize');

    expect(initializeHandler).toBeDefined();

    // Call the handler
    const response = await initializeHandler(initializeRequest);

    // Verify response structure
    expect(response).toHaveProperty('protocolVersion');
    expect(response).toHaveProperty('capabilities');
    expect(response).toHaveProperty('serverInfo');

    expect(response.protocolVersion).toBe('2024-11-05');
    expect(response.serverInfo.name).toBe('gravatar');

    // Verify client info fallbacks are used for empty strings
    expect(serverConfig.client.name).toBe('unknown-client');
    expect(serverConfig.client.version).toBe('unknown-version');

    // Verify console log was called with empty client info
    expect(console.error).toHaveBeenCalledWith('MCP Client connected:  v');
  });

  it('should handle initialization with different protocol versions', async () => {
    const initializeRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-10-01',
        capabilities: {},
        clientInfo: {
          name: 'AnotherClient',
          version: '2.0.0',
        },
      },
    };

    // Get the handler for the initialize request
    const handlers = (server as any)._requestHandlers;
    const initializeHandler = handlers.get('initialize');

    const response = await initializeHandler(initializeRequest);

    // Should echo back the protocol version from the request
    expect(response.protocolVersion).toBe('2024-10-01');

    // Client info should be stored
    expect(serverConfig.client.name).toBe('AnotherClient');
    expect(serverConfig.client.version).toBe('2.0.0');
  });

  it('should handle initialization with special characters in client info', async () => {
    const initializeRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'Test-Client_v2',
          version: '1.0.0-beta.1',
        },
      },
    };

    // Get the handler for the initialize request
    const handlers = (server as any)._requestHandlers;
    const initializeHandler = handlers.get('initialize');

    await initializeHandler(initializeRequest);

    // Verify special characters are preserved
    expect(serverConfig.client.name).toBe('Test-Client_v2');
    expect(serverConfig.client.version).toBe('1.0.0-beta.1');

    expect(console.error).toHaveBeenCalledWith(
      'MCP Client connected: Test-Client_v2 v1.0.0-beta.1',
    );
  });

  it('should update client info on subsequent initializations', async () => {
    // First initialization
    const firstRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'FirstClient',
          version: '1.0.0',
        },
      },
    };

    const handlers = (server as any)._requestHandlers;
    const initializeHandler = handlers.get('initialize');

    await initializeHandler(firstRequest);
    expect(serverConfig.client.name).toBe('FirstClient');
    expect(serverConfig.client.version).toBe('1.0.0');

    // Second initialization (client update)
    const secondRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'UpdatedClient',
          version: '2.0.0',
        },
      },
    };

    await initializeHandler(secondRequest);
    expect(serverConfig.client.name).toBe('UpdatedClient');
    expect(serverConfig.client.version).toBe('2.0.0');

    // Should have logged both connections
    expect(console.error).toHaveBeenCalledWith('MCP Client connected: FirstClient v1.0.0');
    expect(console.error).toHaveBeenCalledWith('MCP Client connected: UpdatedClient v2.0.0');
  });

  it('should return correct server capabilities', async () => {
    const initializeRequest = {
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'TestClient',
          version: '1.0.0',
        },
      },
    };

    const handlers = (server as any)._requestHandlers;
    const initializeHandler = handlers.get('initialize');

    const response = await initializeHandler(initializeRequest);

    // Verify capabilities structure
    expect(response.capabilities).toBeDefined();
    expect(typeof response.capabilities).toBe('object');

    // Should match the capabilities from server config
    expect(response.capabilities).toEqual({
      tools: {},
    });
  });
});
