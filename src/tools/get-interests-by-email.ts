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
  try {
    // Generate identifier from email
    const profileIdentifier = generateIdentifierFromEmail(params.email);

    // Use shared interests fetching utility
    return await fetchInterestsById(profileIdentifier);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch interests for email "${params.email}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
