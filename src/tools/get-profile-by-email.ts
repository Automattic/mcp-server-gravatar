import { generateIdentifier, EmptyStringError } from '../common/utils.js';
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
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetProfileByEmail(params: any) {
  const { email } = params;

  try {
    const profileIdentifier = generateIdentifier(email);
    return await fetchProfileById(profileIdentifier);
  } catch (error) {
    // Handle validation errors with context-specific messages
    if (error instanceof EmptyStringError) {
      return {
        content: [
          {
            type: 'text',
            text: 'Failed to fetch profile: Email parameter is missing or empty. Please provide a valid email address.',
          },
        ],
        isError: true,
      };
    }

    // Handle other errors
    return {
      content: [
        {
          type: 'text',
          text: `Failed to fetch profile for email "${email}": ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}
