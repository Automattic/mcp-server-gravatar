import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { createRestApiConfig } from '../config/server-config.js';

/**
 * Fetch profile by identifier using ProfilesApi
 */
export async function fetchProfileById(profileIdentifier: string) {
  const config = createRestApiConfig();
  const profilesApi = new ProfilesApi(config);
  const profile = await profilesApi.getProfileById({
    profileIdentifier,
  });
  return {
    content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
  };
}
