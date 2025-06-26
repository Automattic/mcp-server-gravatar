import { assertNonEmpty, handleIdToolError } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';
import profileOutputSchema from '../generated/schemas/profile-output-schema.json' with { type: 'json' };

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  title: 'Get Gravatar Profile by ID',
  description:
    "Retrieve comprehensive Gravatar profile information using a profile identifier. Returns detailed profile data including personal information, social accounts, and avatar details. <examples>'Get the profile for Gravatar user with ID abc123...' or 'Show me the profile for username johndoe.'</examples>",
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
export async function handleGetProfileById(params: any) {
  const { profileIdentifier } = params;

  try {
    assertNonEmpty(profileIdentifier);
    return await fetchProfileById(profileIdentifier);
  } catch (error) {
    return handleIdToolError(error, profileIdentifier, 'fetch profile');
  }
}
