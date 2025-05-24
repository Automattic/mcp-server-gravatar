import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { createRestApiConfig } from '../config/server-config.js';
import { mapHttpStatusToError, GravatarResourceNotFoundError } from '../common/errors.js';

/**
 * Fetch interests by identifier using ExperimentalApi
 */
export async function fetchInterestsById(profileIdentifier: string) {
  const config = createRestApiConfig();
  const experimentalApi = new ExperimentalApi(config);

  try {
    const interests = await experimentalApi.getProfileInferredInterestsById({
      profileIdentifier,
    });

    // Extract just the name field from each interest
    const interestNames = interests.map((interest: { name: string }) => interest.name);
    return {
      content: [{ type: 'text', text: JSON.stringify(interestNames, null, 2) }],
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
          message = `No interests found for profile identifier: ${profileIdentifier}. The identifier format is valid, but no profile exists for this hash.`;
          break;
        case 400:
          message = `Invalid profile identifier format: ${profileIdentifier}. Must be a 64-character (SHA256) or 32-character (MD5) hexadecimal string.`;
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

      const gravatarError = await mapHttpStatusToError(status, message);
      throw gravatarError;
    }

    // Handle network or other errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      throw new GravatarResourceNotFoundError(
        `Failed to fetch interests: ${errorWithMessage.message}`,
      );
    }

    // Fallback for unknown errors
    throw new GravatarResourceNotFoundError(
      `Failed to fetch interests for identifier: ${profileIdentifier}`,
    );
  }
}
