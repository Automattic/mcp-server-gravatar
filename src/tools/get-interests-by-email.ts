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
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetInterestsByEmail(params: any) {
  const { email } = params;

  try {
    // Generate identifier from email
    const profileIdentifier = generateIdentifierFromEmail(email);

    // Use shared interests fetching utility
    return await fetchInterestsById(profileIdentifier);
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch interests for email "${email}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
