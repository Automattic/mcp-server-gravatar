import { assertNonEmpty, handleIdToolError } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  title: 'Get Gravatar Profile by ID',
  description:
    "Retrieve comprehensive Gravatar profile information using a profile identifier. Returns the same succinct, detailed profile data as the email variant including display name, location, job title, company, bio/description, pronouns, pronunciation, verified social accounts, avatar details, and profile URLs. Additional authenticated data may include languages, interests, links, contact info, and gallery images.   The response must include all of the data contained in the response, and it must only contain that data.  The response must not include any summaries, editorial, or opinions about the data in the profile, unless requested explicitly. Example prompt: 'Get the profile for Gravatar user with ID abc123def456abc123def456abc123def456abc123def456abc123def456abc1' or 'Show me the profile for Gravatar username johndoe.'  Note: When responding to a request for interests, prefer the interests in the Gravatar profile over inferred interests unless the request specifically mentioned 'inferred interests' or similar phrasing. If a profile response contains no interests, attempt to fetch inferred interests using the `get_inferred_interests_by_email` tool.",
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
export async function handleGetProfileById(params: any) {
  const { profileIdentifier } = params;

  try {
    assertNonEmpty(profileIdentifier);
    return await fetchProfileById(profileIdentifier);
  } catch (error) {
    return handleIdToolError(error, profileIdentifier, 'fetch profile');
  }
}
