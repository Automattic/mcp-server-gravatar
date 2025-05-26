import { fetchInterestsById } from './experimental-utils.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

// Tool definition
export const getInterestsByIdTool = {
  name: 'get_inferred_interests_by_id',
  description: 'Fetch inferred interests for a Gravatar profile using a profile identifier.',
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
  return await fetchInterestsById(params.profileIdentifier);
}
