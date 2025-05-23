/**
 * Server Configuration
 *
 * This file contains all the configuration options for the MCP server.
 * You can customize these options by setting environment variables
 * or by modifying the default values directly in this file.
 */

import { VERSION } from '../common/version.js';
import { getUserAgent as getUniversalUserAgent } from 'universal-user-agent';
import { Configuration } from '../generated/gravatar-api/runtime.js';

export enum ApiConfigType {
  RestApi,
  AvatarImageApi,
}

/**
 * Gets the API key from the environment variables
 * Uses the environment variable name specified in securityConfig
 * @returns The API key or undefined if not set
 */
async function getApiKey(): Promise<string | undefined> {
  return process.env[securityConfig.apiKeyEnvVar];
}

/**
 * Client information interface
 */
export interface ClientInfo {
  name: string;
  version: string;
}

/**
 * Global storage for MCP client information
 * This is set during the MCP initialization phase
 */
let clientInfo: ClientInfo | null = null;

/**
 * Sets the MCP client information
 * Called during the MCP initialization phase
 * @param info The client information from the initialize request
 */
function setClientInfo(info: ClientInfo): void {
  clientInfo = info;
}

/**
 * Gets the User-Agent string for API requests
 * @returns The User-Agent string with client info if available
 */
function getUserAgent(): string {
  const serverPart = `mcp-server-gravatar/v${VERSION}`;
  const systemPart = getUniversalUserAgent();

  // Only include client info if it exists and has meaningful values
  if (clientInfo && clientInfo.name && clientInfo.version) {
    return `${serverPart} (client: ${clientInfo.name}/${clientInfo.version}) ${systemPart}`;
  }

  return `${serverPart} ${systemPart}`;
}

/**
 * Creates a configuration object for API clients
 * Uses the API key from environment variables and includes client headers
 * @param apiType The type of API configuration to create
 * @returns Configuration object with API key, User-Agent, and client headers
 */
async function createApiConfiguration(apiType: ApiConfigType): Promise<Configuration> {
  // Get API key from environment variables
  const apiKey = await getApiKey();

  // Determine basePath based on API type
  let basePath: string | undefined;
  switch (apiType) {
    case ApiConfigType.AvatarImageApi:
      basePath = apiConfig.avatarBaseUrl;
      break;
    case ApiConfigType.RestApi:
    default:
      basePath = undefined;
      break;
  }

  // Create configuration with headers including client info
  const config: {
    headers: { [key: string]: string };
    accessToken?: () => Promise<string>;
    basePath?: string;
  } = {
    headers: {
      'User-Agent': getUserAgent(),
      'X-Platform': 'mcp-server-gravatar-stdio',
      'X-Source': clientInfo?.name || 'unknown-client',
    },
  };

  // Add basePath if specified
  if (basePath) {
    config.basePath = basePath;
  }

  // Add API key if available (as function format expected by generated client)
  if (apiKey) {
    config.accessToken = async () => apiKey;
  }

  return new Configuration(config);
}

/**
 * Basic server information
 *
 * - name: The name of the server, used in MCP protocol communications
 * - version: The version of the server, automatically pulled from package.json
 * - description: A human-readable description of the server's purpose
 */
export const serverInfo = {
  name: 'gravatar',
  version: VERSION,
  description: 'MCP Server for Gravatar API',
};

/**
 * MCP capabilities
 *
 * Defines the capabilities of this MCP server.
 * Currently empty, but can be extended with tool-specific capabilities.
 */
export const capabilities = {
  tools: {}, // Tool-specific capabilities
};

/**
 * API configuration
 *
 * - avatarBaseUrl: The base URL for Gravatar avatar images
 *
 * Note: The API base URL is handled by the generated API client
 * and doesn't need to be specified here.
 */
export const apiConfig = {
  avatarBaseUrl: 'https://gravatar.com/avatar',
};

/**
 * Security configuration
 *
 * - apiKeyEnvVar: The name of the environment variable that contains the API key
 *   Override with GRAVATAR_API_KEY_ENV_VAR environment variable
 * - apiKey: Getter that returns the API key from environment variables
 *
 * To use an API key, set the environment variable specified by apiKeyEnvVar
 * Example: export GRAVATAR_API_KEY=your_api_key_here
 */
export const securityConfig = {
  apiKeyEnvVar: process.env.GRAVATAR_API_KEY_ENV_VAR || 'GRAVATAR_API_KEY',
  get apiKey() {
    return getApiKey();
  },
};

/**
 * Client configuration
 *
 * Provides access to MCP client information with fallbacks.
 * Client information is set during the MCP initialization phase.
 */
export const clientConfig = {
  /**
   * Sets the client information (called during MCP initialization)
   */
  setInfo: setClientInfo,

  /**
   * Gets the stored client information
   */
  get info(): ClientInfo | null {
    return clientInfo;
  },

  /**
   * Gets the client name with fallback
   */
  get name(): string {
    return clientInfo?.name || 'unknown-client';
  },

  /**
   * Gets the client version with fallback
   */
  get version(): string {
    return clientInfo?.version || 'unknown-version';
  },

  /**
   * Gets the enhanced User-Agent string
   */
  get userAgent(): string {
    return getUserAgent();
  },
};

/**
 * Complete server configuration
 *
 * Combines all configuration sections into a single object.
 * This is exported for convenience when you need the entire configuration.
 */
export const serverConfig = {
  ...serverInfo,
  capabilities,
  api: apiConfig,
  security: securityConfig,
  client: clientConfig,
  get userAgent() {
    return getUserAgent();
  },
  createApiConfiguration,
};
