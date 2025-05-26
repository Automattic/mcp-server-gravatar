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
  if (!params.email) {
    return {
      content: [
        {
          type: 'text',
          text: 'Error: email is required',
        },
      ],
      isError: true,
    };
  }

  // Generate identifier from email
  const profileIdentifier = generateIdentifierFromEmail(params.email);

  // Use shared profile fetching utility
  return await fetchProfileById(profileIdentifier);
}
