#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

import { tools, handlers } from './tools/index.js';
import { serverInfo, capabilities, setClientInfo } from './config/server-config.js';

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
  return { tools };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async request => {
  try {
    const toolName = request.params.name;
    const handler = handlers[toolName];

    if (!handler) {
      return {
        content: [
          {
            type: 'text',
            text: `Error: Unknown tool: ${toolName}`,
          },
        ],
        isError: true,
      };
    }

    // We need to cast the arguments to any to avoid TypeScript errors
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await handler(request.params.arguments as any);
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
