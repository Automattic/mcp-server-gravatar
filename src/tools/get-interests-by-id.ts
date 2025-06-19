import { assertNonEmpty, handleIdToolError } from '../common/utils.js';
import { fetchInterestsById } from './experimental-utils.js';

// Tool definition
export const getInterestsByIdTool = {
  name: 'get_inferred_interests_by_id',
  description:
    "Fetch AI-inferred interests for a Gravatar profile using a profile identifier. Returns a succinct list of machine learning-generated interests that can help understand user preferences, content recommendations, or audience insights. This is experimental data that may not be available for profiles.  When searching for interests, prefer to look up the interests in the Gravatar profile over the inferred interests, since they are specified explicitly by the owner of the Gravatar profile.  The response must include all of the data contained in the response, and it must only contain that data.  The response must not include any summaries, editorial, or opinions about the data, unless requested explicitly.  Example prompt: 'What are the inferred interests for this Gravatar user?' or 'Get the inferred interests for profile ID abc123def456abc123def456abc123def456abc123def456abc123def456abc1.'",
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
