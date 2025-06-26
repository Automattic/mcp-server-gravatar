import { assertNonEmpty, handleIdToolError } from '../common/utils.js';
import { fetchInterestsById } from './experimental-utils.js';
import interestsOutputSchema from '../generated/schemas/interests-output-schema.json' with { type: 'json' };

// Tool definition
export const getInterestsByIdTool = {
  name: 'get_inferred_interests_by_id',
  title: 'Get Inferred Interests by ID',
  description:
    "Retrieve AI-inferred interests for a Gravatar profile using a profile identifier. Returns experimental machine learning-generated interest data based on public profile information. <hint>When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.</hint> <examples>'Get the inferred interests for user ID abc123...' or 'Show me inferred interests for username johndoe.'</examples>",
  inputSchema: {
    type: 'object',
    properties: {
      profileIdentifier: {
        type: 'string',
        description:
          "Profile identifier for the Gravatar profile. A Profile Identifier is either an email address that has been normalized (e.g. lower-cased and trimmed) and then hashed with either SHA256 (preferred) or MD5 (deprecated), or Gravatar profile URL slug (e.g., 'username' from gravatar.com/username).",
      },
    },
    required: ['profileIdentifier'],
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
export async function handleGetInterestsById(params: any) {
  const { profileIdentifier } = params;

  try {
    assertNonEmpty(profileIdentifier);
    return await fetchInterestsById(profileIdentifier);
  } catch (error) {
    return handleIdToolError(error, profileIdentifier, 'fetch interests');
  }
}
