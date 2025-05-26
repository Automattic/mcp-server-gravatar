import { generateIdentifierFromEmail } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';

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
  try {
    // Generate identifier from email
    const profileIdentifier = generateIdentifierFromEmail(params.email);

    // Use shared profile fetching utility
    return await fetchProfileById(profileIdentifier);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch profile for email "${params.email}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
