import { generateIdentifier, handleEmailToolError } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';
import profileOutputSchema from '../generated/schemas/profile-output-schema.json' with { type: 'json' };

// Tool definition
export const getProfileByEmailTool = {
  name: 'get_profile_by_email',
  title: 'Get Gravatar Profile by Email',
  description:
    "Retrieve comprehensive Gravatar profile information using an email address. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Show me the Gravatar profile for john.doe@example.com' or 'Get profile info for user@company.com.'</examples>",
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description:
          'The email address associated with the Gravatar profile. Can be any valid email format - the system will automatically normalize and hash the email for lookup. The email is processed securely and not stored.',
      },
    },
    required: ['email'],
  },
  outputSchema: profileOutputSchema,
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
    idempotentHint: true,
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
    return handleEmailToolError(error, email, 'fetch profile');
  }
}
