import { fetchProfileById } from './profile-utils.js';

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
// MCP framework validates parameters against tool schema before calling handlers.
// Using 'any' here matches the industry standard pattern and allows for flexible
// destructuring while maintaining type safety through schema validation.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetProfileById(params: any) {
  const { profileIdentifier } = params;

  try {
    return await fetchProfileById(profileIdentifier);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch profile for identifier "${profileIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
