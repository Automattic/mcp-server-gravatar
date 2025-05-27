#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { serverInfo, capabilities, setClientInfo } from './config/server-config.js';

// Import tool definitions and handlers directly
import { getProfileByIdTool, handleGetProfileById } from './tools/get-profile-by-id.js';
import { getProfileByEmailTool, handleGetProfileByEmail } from './tools/get-profile-by-email.js';
import { getInterestsByIdTool, handleGetInterestsById } from './tools/get-interests-by-id.js';
import {
  getInterestsByEmailTool,
  handleGetInterestsByEmail,
} from './tools/get-interests-by-email.js';
import { getAvatarByIdTool, handleGetAvatarById } from './tools/get-avatar-by-id.js';
import { getAvatarByEmailTool, handleGetAvatarByEmail } from './tools/get-avatar-by-email.js';

// Create MCP server
const server = new Server(serverInfo, { capabilities });

// Handle MCP initialization
server.setRequestHandler(InitializeRequestSchema, async request => {
  // Store client information if provided
  if (request.params.clientInfo) {
    setClientInfo(request.params.clientInfo.name, request.params.clientInfo.version);

    console.error(
      `MCP Client connected: ${request.params.clientInfo.name} v${request.params.clientInfo.version}`,
    );
  } else {
    console.error('MCP Client connected (no client info provided)');
  }

  // Return server capabilities and information
  return {
    protocolVersion: request.params.protocolVersion,
    capabilities: capabilities,
    serverInfo: {
      name: serverInfo.name,
      version: serverInfo.version,
    },
  };
});

// Define available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      getProfileByIdTool,
      getProfileByEmailTool,
      getInterestsByIdTool,
      getInterestsByEmailTool,
      getAvatarByIdTool,
      getAvatarByEmailTool,
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    switch (request.params.name) {
      case 'get_profile_by_id': {
        return await handleGetProfileById(request.params.arguments);
      }

      case 'get_profile_by_email': {
        return await handleGetProfileByEmail(request.params.arguments);
      }

      case 'get_inferred_interests_by_id': {
        return await handleGetInterestsById(request.params.arguments);
      }

      case 'get_inferred_interests_by_email': {
        return await handleGetInterestsByEmail(request.params.arguments);
      }

      case 'get_avatar_by_id': {
        return await handleGetAvatarById(request.params.arguments);
      }

      case 'get_avatar_by_email': {
        return await handleGetAvatarByEmail(request.params.arguments);
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Error: Unknown tool: ${request.params.name}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function runServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Gravatar MCP Server running on stdio');
  console.error(`Version: ${serverInfo.version}`);
}

runServer().catch(error => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});

// Export the server for testing
export default server;
