import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { createRestApiConfig } from '../config/server-config.js';
import { validateHash } from '../common/utils.js';

// Schema definition (moved from service)
export const getProfileByIdSchema = z.object({
  profileIdentifier: z.string().refine(validateHash, {
    message:
      'Invalid identifier format. Must be a 64-character (SHA256) or 32-character (MD5, deprecated) hexadecimal string.',
  }),
});

// Tool definition
export const getProfileByIdTool = {
  name: 'get_profile_by_id',
  description: 'Fetch a Gravatar profile using a profile identifier.',
  inputSchema: zodToJsonSchema(getProfileByIdSchema),
};

// Tool handler
export async function handler(params: z.infer<typeof getProfileByIdSchema>) {
  const config = createRestApiConfig();
  const profilesApi = new ProfilesApi(config);
  const profile = await profilesApi.getProfileById({
    profileIdentifier: params.profileIdentifier,
  });
  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
