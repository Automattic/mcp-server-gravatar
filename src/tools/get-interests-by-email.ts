import { generateIdentifier, handleEmailToolError } from '../common/utils.js';
import { fetchInterestsById } from './experimental-utils.js';

// Tool definition
export const getInterestsByEmailTool = {
  name: 'get_inferred_interests_by_email',
  title: 'Get Inferred Interests by Email',
  description:
    "Fetch AI-inferred interests for a Gravatar profile using an email address. Returns a list of interests that Gravatar's machine learning algorithms have associated with the profile.   The response must include all of the data contained in the response, and it must only contain that data.  The response must not include any summaries, editorial, or opinions about the data, unless requested explicitly. This experimental feature helps understand user preferences and topics of interest. Example prompt: 'What are the inferred interests for user@company.com?' or 'Show me the inferred interests for this email address.'.  When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.  Inferred interests can also be returned, but only if the request specifically references 'inferred interests' or similar phrasing, and the response must explicitly mention that they are inferred by Gravatar's Experimental AI service.",
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
  annotations: {
    readOnlyHint: true,
    openWorldHint: true,
    idempotentHint: false,
  },
};

// Tool handler
// MCP framework validates parameters against tool schema before calling handlers.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleGetInterestsByEmail(params: any) {
  const { email } = params;

  try {
    const profileIdentifier = generateIdentifier(email);
    return await fetchInterestsById(profileIdentifier);
  } catch (error) {
    return handleEmailToolError(error, email, 'fetch interests');
  }
}
