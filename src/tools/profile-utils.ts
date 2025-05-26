import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { createRestApiConfig } from '../config/server-config.js';

/**
 * Fetch profile by identifier using ProfilesApi
 */
export async function fetchProfileById(profileIdentifier: string) {
  const config = createRestApiConfig();
  const profilesApi = new ProfilesApi(config);

  try {
    const profile = await profilesApi.getProfileById({
      profileIdentifier,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(profile, null, 2) }],
    };
  } catch (error: unknown) {
    // Handle HTTP errors from the API
    if (error && typeof error === 'object' && 'response' in error) {
      const httpError = error as { response: { status: number; statusText?: string } };
      const status = httpError.response.status;
      const statusText = httpError.response.statusText || 'Unknown error';

      // Provide specific error messages for common cases
      let message: string;
      switch (status) {
        case 404:
          message = `No profile found for identifier: ${profileIdentifier}.`;
          break;
        case 400:
          message = `Invalid profile identifier format: ${profileIdentifier}. Must be a 64-character (SHA256) or 32-character (MD5, deprecated) hexadecimal string.`;
          break;
        case 403:
          message = `Profile is private or access denied for identifier: ${profileIdentifier}`;
          break;
        case 429:
          message = `Rate limit exceeded. Please try again later.`;
          break;
        default:
          message = `Gravatar API error (${status}): ${statusText}`;
      }

      throw new Error(message);
    }

    // Handle network or other errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      throw new Error(`Failed to fetch profile: ${errorWithMessage.message}`);
    }

    // Fallback for unknown errors
    throw new Error(`Failed to fetch profile for identifier: ${profileIdentifier}`);
  }
}
