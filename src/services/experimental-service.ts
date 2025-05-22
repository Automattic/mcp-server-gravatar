import {
  validateEmail,
  validateHash,
  generateIdentifierFromEmail,
  createApiConfiguration,
} from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import type { IExperimentalService, IExperimentalApiClient } from './interfaces.js';
import type { Interest } from '../generated/gravatar-api/models/Interest.js';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { isApiErrorResponse } from '../common/types.js';
import { mapHttpStatusToError } from '../common/utils.js';

/**
 * Service for interacting with Gravatar experimental features
 * Uses the ExperimentalApi client directly
 */
export class ExperimentalService implements IExperimentalService {
  constructor(private readonly experimentalApiClient: IExperimentalApiClient) {}

  /**
   * Get inferred interests for a profile by its identifier (hash)
   * @param hash The profile identifier (MD5 or SHA256 hash)
   * @returns The inferred interests
   */
  async getInferredInterestsById(hash: string): Promise<Interest[]> {
    try {
      // Validate hash
      if (!validateHash(hash)) {
        throw new GravatarValidationError('Invalid hash format');
      }

      // Use API client directly
      const response = await this.experimentalApiClient.getProfileInferredInterestsById({
        profileIdentifier: hash,
      });
      return response;
    } catch (error: unknown) {
      // Handle API errors (moved from adapter)
      if (isApiErrorResponse(error)) {
        const mappedError = await mapHttpStatusToError(
          error.response?.status || 500,
          error.message || 'Failed to fetch inferred interests',
        );
        throw mappedError;
      }

      throw error;
    }
  }

  /**
   * Get inferred interests for a profile by email address
   * @param email The email address
   * @returns The inferred interests
   */
  async getInferredInterestsByEmail(email: string): Promise<Interest[]> {
    // Validate email
    if (!validateEmail(email)) {
      throw new GravatarValidationError('Invalid email format');
    }

    // Generate identifier from email
    const identifier = generateIdentifierFromEmail(email);

    // Use getInferredInterestsById to fetch the inferred interests
    return await this.getInferredInterestsById(identifier);
  }
}

/**
 * Factory function to create an ExperimentalService with the default API client
 * @returns A new ExperimentalService instance
 */
export async function createExperimentalService(): Promise<IExperimentalService> {
  const config = await createApiConfiguration();
  return new ExperimentalService(new ExperimentalApi(config));
}
