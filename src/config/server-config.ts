/**
 * Server Configuration
 *
 * This file contains all the configuration options for the MCP server.
 * You can customize these options by setting environment variables
 * or by modifying the default values directly in this file.
 */

import { VERSION } from '../common/version.js';

/**
 * Gets the API key from the environment variables
 * Uses the environment variable name specified in securityConfig
 * @returns The API key or undefined if not set
 */
async function getApiKey(): Promise<string | undefined> {
  return process.env[securityConfig.apiKeyEnvVar];
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
};
