/**
 * Simplified Server Configuration
 */

import { VERSION } from '../common/version.js';
import { getUserAgent as getUniversalUserAgent } from 'universal-user-agent';
import { Configuration } from '../generated/gravatar-api/runtime.js';

/**
 * Simple configuration object
 */
export const config = {
  // Server info
  name: 'gravatar',
  version: VERSION,
  description: 'MCP Server for Gravatar API',

  // API configuration
  get apiKey() {
    return process.env.GRAVATAR_API_KEY;
  },
  restApiBase: 'https://api.gravatar.com/v3',
  avatarApiBase: 'https://gravatar.com/avatar',

  // Client info (set during initialization)
  clientName: 'unknown-client',
  clientVersion: 'unknown-version',
};

/**
 * MCP capabilities
 */
export const capabilities = {
  tools: {},
};

/**
 * Server info for MCP protocol
 */
export const serverInfo = {
  name: config.name,
  version: config.version,
  description: config.description,
};

/**
 * Set client information during MCP initialization
 */
export function setClientInfo(name: string, version: string): void {
  config.clientName = name || 'unknown-client';
  config.clientVersion = version || 'unknown-version';
}

/**
 * Get User-Agent string for API requests
 */
export function getUserAgent(): string {
  const serverPart = `mcp-server-gravatar/v${config.version}`;
  const systemPart = getUniversalUserAgent();

  if (config.clientName !== 'unknown-client' && config.clientName !== '') {
    return `${serverPart} (client: ${config.clientName}/${config.clientVersion}) ${systemPart}`;
  }

  return `${serverPart} ${systemPart}`;
}

/**
 * Create configuration for REST API clients
 */
export function createRestApiConfig(): Configuration {
  const configObj: {
    headers: { [key: string]: string };
    accessToken?: () => Promise<string>;
  } = {
    headers: {
      'User-Agent': getUserAgent(),
      'X-Platform': 'mcp-server-gravatar-stdio',
      'X-Source': config.clientName,
    },
  };

  // Check for API key at runtime, not module load time
  const apiKey = config.apiKey;
  if (apiKey) {
    configObj.accessToken = async () => apiKey;
  }

  return new Configuration(configObj);
}

/**
 * Create configuration for avatar API (with base path)
 */
export function createAvatarApiConfig(): Configuration {
  return new Configuration({
    basePath: config.avatarApiBase,
    headers: {
      'User-Agent': getUserAgent(),
    },
  });
}

// Legacy enum for backward compatibility
export enum ApiConfigType {
  RestApi = 0,
  AvatarImageApi = 1,
}

// Legacy exports for backward compatibility during transition
export const serverConfig = {
  name: config.name,
  version: config.version,
  description: config.description,
  capabilities,
  api: {
    avatarBaseUrl: config.avatarApiBase,
  },
  security: {
    apiKeyEnvVar: process.env.GRAVATAR_API_KEY_ENV_VAR || 'GRAVATAR_API_KEY',
    get apiKey() {
      return Promise.resolve(
        process.env[process.env.GRAVATAR_API_KEY_ENV_VAR || 'GRAVATAR_API_KEY'],
      );
    },
  },
  client: {
    setInfo: (info: { name: string; version: string }) => setClientInfo(info.name, info.version),
    get info() {
      return config.clientName !== 'unknown-client' && config.clientName !== ''
        ? { name: config.clientName, version: config.clientVersion }
        : null;
    },
    get name() {
      return config.clientName === '' ? 'unknown-client' : config.clientName;
    },
    get version() {
      return config.clientVersion === '' ? 'unknown-version' : config.clientVersion;
    },
  },
  get userAgent() {
    return getUserAgent();
  },
  createApiConfiguration: (apiType: ApiConfigType) => {
    return apiType === ApiConfigType.AvatarImageApi
      ? createAvatarApiConfig()
      : createRestApiConfig();
  },
};
