import { generateIdentifierFromEmail } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Tool definition
export const getProfileByEmailTool = {
  name: 'get_profile_by_email',
  description: 'Fetch a Gravatar profile using an email address.',
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description: 'Email address',
      },
    },
    required: ['email'],
  },
};

// Tool handler
export async function handler(params: { email: string }) {
  if (!params.email) {
    throw new McpError(ErrorCode.InvalidParams, 'email is required');
  }

  // Generate identifier from email
  const profileIdentifier = generateIdentifierFromEmail(params.email);

  // Use shared profile fetching utility
  return await fetchProfileById(profileIdentifier);
}
