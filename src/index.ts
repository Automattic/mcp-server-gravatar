#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  InitializeRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

import { tools, handlers } from './tools/index.js';
import { serverInfo, capabilities, serverConfig } from './config/server-config.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Create MCP server
const server = new Server(serverInfo, { capabilities });

// Handle MCP initialization
server.setRequestHandler(InitializeRequestSchema, async request => {
  // Store client information if provided
  if (request.params.clientInfo) {
    serverConfig.client.setInfo({
      name: request.params.clientInfo.name,
      version: request.params.clientInfo.version,
    });

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
    if (!request.params.arguments) {
      throw new McpError(ErrorCode.InvalidParams, 'Arguments are required');
    }

    const toolName = request.params.name;
    const handler = handlers[toolName];

    if (!handler) {
      throw new McpError(ErrorCode.InvalidRequest, `Unknown tool: ${toolName}`);
    }

    // We need to cast the arguments to any to avoid TypeScript errors
    // The actual validation happens inside each handler with Zod
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await handler(request.params.arguments as any);
  } catch (error) {
    if (error instanceof McpError) throw error;

    if (error instanceof z.ZodError) {
      throw new McpError(ErrorCode.InvalidParams, `Invalid input: ${JSON.stringify(error.errors)}`);
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Tool execution failed: ${error instanceof Error ? error.message : String(error)}`,
    );
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
