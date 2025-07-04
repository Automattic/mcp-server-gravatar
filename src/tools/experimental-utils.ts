import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { createRestApiConfig } from '../config/server-config.js';

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

    // Prepare the structured response that matches our output schema
    const structuredResponse = { inferredInterests: interests };

    // Return both unstructured content (backwards compatibility) and structured content
    return {
      content: [{ type: 'text', text: JSON.stringify(structuredResponse, null, 2) }],
      structuredContent: structuredResponse,
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

      throw new Error(message);
    }

    // Handle network or other errors
    if (error && typeof error === 'object' && 'message' in error) {
      const errorWithMessage = error as { message: string };
      throw new Error(`Failed to fetch interests: ${errorWithMessage.message}`);
    }

    // Fallback for unknown errors
    throw new Error(`Failed to fetch interests for identifier: ${profileIdentifier}`);
  }
}
