import { generateIdentifierFromEmail } from '../common/utils.js';
import { fetchInterestsById } from './experimental-utils.js';

// Tool definition
export const getInterestsByEmailTool = {
  name: 'get_inferred_interests_by_email',
  description: 'Fetch inferred interests for a Gravatar profile using an email address.',
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

  // Use shared interests fetching utility
  return await fetchInterestsById(profileIdentifier);
}
