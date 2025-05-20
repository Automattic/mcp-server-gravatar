import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
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

// Schema for getInferredInterestsById
export const getInferredInterestsByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message:
      'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.',
  }),
});

// Schema for getInferredInterestsByEmail
export const getInferredInterestsByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.',
  }),
});

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
      console.error(`ExperimentalService.getInferredInterestsById called with hash: ${hash}`);

      // Validate hash
      if (!validateHash(hash)) {
        console.error(`Invalid hash format: ${hash}`);
        throw new GravatarValidationError('Invalid hash format');
      }

      // Use API client directly
      console.error(`Calling ExperimentalApi.getProfileInferredInterestsById for hash: ${hash}`);
      const response = await this.experimentalApiClient.getProfileInferredInterestsById({
        profileIdentifier: hash,
      });
      console.error(`Received response for hash ${hash}:`, response);
      return response;
    } catch (error: unknown) {
      console.error(`Error getting inferred interests for hash ${hash}:`, error);

      // Handle API errors (moved from adapter)
      if (isApiErrorResponse(error)) {
        const mappedError = await mapHttpStatusToError(
          error.response?.status || 500,
          error.message || 'Failed to fetch inferred interests',
        );
        console.error(`Mapped error:`, mappedError);
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
    try {
      console.error(`ExperimentalService.getInferredInterestsByEmail called with email: ${email}`);

      // Validate email
      if (!validateEmail(email)) {
        console.error(`Invalid email format: ${email}`);
        throw new GravatarValidationError('Invalid email format');
      }

      // Generate identifier from email
      const identifier = generateIdentifierFromEmail(email);
      console.error(`Generated identifier from email: ${identifier}`);

      // Use getInferredInterestsById to fetch the inferred interests
      return await this.getInferredInterestsById(identifier);
    } catch (error) {
      console.error(`Error getting inferred interests for email ${email}:`, error);
      throw error;
    }
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

// Tool definitions for MCP
export const experimentalTools = [
  {
    name: 'getInferredInterestsById',
    description:
      'Fetch inferred interests for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
    handler: async (params: z.infer<typeof getInferredInterestsByIdSchema>) => {
      const service = await createExperimentalService();
      return await service.getInferredInterestsById(params.hash);
    },
  },
  {
    name: 'getInferredInterestsByEmail',
    description: 'Fetch inferred interests for a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getInferredInterestsByEmailSchema),
    handler: async (params: z.infer<typeof getInferredInterestsByEmailSchema>) => {
      const service = await createExperimentalService();
      return await service.getInferredInterestsByEmail(params.email);
    },
  },
];
