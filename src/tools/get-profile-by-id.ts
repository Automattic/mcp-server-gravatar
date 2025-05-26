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
  if (!params.profileIdentifier) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: profileIdentifier is required',
        },
      ],
      isError: true,
    };
  }

  // Let Gravatar API handle format validation
  return await fetchProfileById(params.profileIdentifier);
}
