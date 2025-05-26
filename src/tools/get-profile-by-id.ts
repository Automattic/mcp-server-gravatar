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
export async function handler(params: { profileIdentifier: string }) {
  try {
    return await fetchProfileById(params.profileIdentifier);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch profile for identifier "${params.profileIdentifier}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
