import { fetchProfileById } from './profile-utils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  description: 'Fetch a Gravatar profile using a profile identifier.',
  inputSchema: {
    type: 'object',
    properties: {
      profileIdentifier: {
        type: 'string',
        description: 'Profile identifier (32 or 64 character hash)',
      },
    },
    required: ['profileIdentifier'],
  },
};

// Tool handler
export async function handler(params: { profileIdentifier: string }) {
  if (!params.profileIdentifier) {
    throw new McpError(ErrorCode.InvalidParams, 'profileIdentifier is required');
  }

  // Let Gravatar API handle format validation
  return await fetchProfileById(params.profileIdentifier);
}
