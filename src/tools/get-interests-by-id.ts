import { fetchInterestsById } from './experimental-utils.js';

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
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetInterestsById(params: any) {
  const { profileIdentifier } = params;

  try {
    return await fetchInterestsById(profileIdentifier);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch interests for identifier "${profileIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
