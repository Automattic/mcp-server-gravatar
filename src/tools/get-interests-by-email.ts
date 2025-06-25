import { generateIdentifier, handleEmailToolError } from '../common/utils.js';
import { fetchInterestsById } from './experimental-utils.js';
import interestsOutputSchema from '../generated/schemas/interests-output-schema.json' with { type: 'json' };

// Tool definition
export const getInterestsByEmailTool = {
  name: 'get_inferred_interests_by_email',
  title: 'Get Inferred Interests by Email',
  description:
    "Retrieve AI-inferred interests for a Gravatar profile using an email address. Returns experimental machine learning-generated interest data based on public profile information. <hint>When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.</hint> <examples>'Get the inferred interests for user@example.com' or 'Show me inferred interests for john.doe@company.com.'</examples>",
  inputSchema: {
    type: 'object',
    properties: {
      email: {
        type: 'string',
        description:
          'Email address for the Gravatar profile. The email will be normalized (lowercased and trimmed) and hashed before querying the Gravatar API.',
      },
    },
    required: ['email'],
  },
  outputSchema: interestsOutputSchema,
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
