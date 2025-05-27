import { assertNonEmpty, handleIdToolError } from '../common/utils.js';
import { fetchProfileById } from './profile-utils.js';

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  description: 'Fetch a Gravatar profile using a profile identifier.',
  inputSchema: {
    type: 'object',
    properties: {
      profileIdentifier: {
        type: 'string',
        description: 'Profile identifier (hash)',
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
