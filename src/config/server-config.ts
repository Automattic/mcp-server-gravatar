import { VERSION } from '../common/version.js';

// Basic server information
export const serverInfo = {
  name: 'gravatar',
  version: VERSION,
  description: 'MCP Server for Gravatar API',
};

// MCP capabilities
export const capabilities = {
  tools: {}, // Tool-specific capabilities
};

// API configuration
export const apiConfig = {
  baseUrl: process.env.GRAVATAR_API_BASE_URL || 'https://api.gravatar.com/v3',
  avatarBaseUrl: process.env.GRAVATAR_AVATAR_BASE_URL || 'https://gravatar.com/avatar',
};

// Security configuration
export const securityConfig = {
  apiKeyEnvVar: process.env.GRAVATAR_API_KEY_ENV_VAR || 'GRAVATAR_API_KEY',
};

// Export the complete server configuration
export const serverConfig = {
  ...serverInfo,
  capabilities,
  api: apiConfig,
  security: securityConfig,
};
