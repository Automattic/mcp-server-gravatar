import { generateIdentifier, handleEmailToolError } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';

// Tool definition
export const getProfileByEmailTool = {
  name: 'get_profile_by_email',
  description:
    "Retrieve comprehensive Gravatar profile information using an email address. Returns detailed user profile data including display name, location, job title, company, bio/description, pronouns, pronunciation, verified social accounts, avatar details, and profile URLs. Additional data like languages, interests, links, contact info, and gallery images may be available with authenticated requests. Example prompt: 'Can you show me the Gravatar profile information for john.doe@example.com?' or 'Show me the interests for john.doe@example.com.'  Note: When responding to a request for interests, prefer the interests in the Gravatar profile over inferred interests unless the request specifically mentioned 'inferred interests' or similar phrasing. If a profile response contains no interests, attempt to fetch inferred interests using the `get_inferred_interests_by_id` tool.",
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
