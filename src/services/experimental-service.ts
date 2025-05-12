import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { validateEmail, validateHash, generateIdentifierFromEmail, createApiConfiguration, mapHttpStatusToError } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import type { IExperimentalClient, IExperimentalService } from './interfaces.js';

// Schema for getInferredInterestsById
export const getInferredInterestsByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message: 'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.'
  })
});

// Schema for getInferredInterestsByEmail
export const getInferredInterestsByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.'
  })
});

// Implement the ExperimentalService
export class ExperimentalService implements IExperimentalService {
  constructor(private readonly client: IExperimentalClient) {}

  async getInferredInterestsById(hash: string): Promise<any> {
    try {
      console.log(`ExperimentalService.getInferredInterestsById called with hash: ${hash}`);
      
      // Validate hash
      if (!validateHash(hash)) {
        console.error(`Invalid hash format: ${hash}`);
        throw new GravatarValidationError('Invalid hash format');
      }

      // Make API call
      console.log(`Making API call to get inferred interests for hash: ${hash}`);
      const response = await this.client.getProfileInferredInterestsById({ profileIdentifier: hash });
      console.log(`Received response for hash ${hash}:`, response);
      return response;
    } catch (error: any) {
      console.error(`Error getting inferred interests for hash ${hash}:`, error);
      if (error.response && error.response.status) {
        const mappedError = await mapHttpStatusToError(error.response.status, error.message || 'Failed to fetch inferred interests');
        console.error(`Mapped error:`, mappedError);
        throw mappedError;
      }
      throw error;
    }
  }

  async getInferredInterestsByEmail(email: string): Promise<any> {
    try {
      console.log(`ExperimentalService.getInferredInterestsByEmail called with email: ${email}`);
      
      // Validate email
      if (!validateEmail(email)) {
        console.error(`Invalid email format: ${email}`);
        throw new GravatarValidationError('Invalid email format');
      }

      // Generate identifier from email
      const identifier = generateIdentifierFromEmail(email);
      console.log(`Generated identifier from email: ${identifier}`);

      // Use getInferredInterestsById to fetch the inferred interests
      return await this.getInferredInterestsById(identifier);
    } catch (error) {
      console.error(`Error getting inferred interests for email ${email}:`, error);
      throw error;
    }
  }
}

// Factory function to create the default client
export function createExperimentalClient(): IExperimentalClient {
  return new ExperimentalApi(createApiConfiguration());
}

// Factory function to create the service with optional client
export function createExperimentalService(client?: IExperimentalClient): IExperimentalService {
  return new ExperimentalService(client || createExperimentalClient());
}

// Default instance for convenience
export const defaultExperimentalService = createExperimentalService();

// Tool definitions for MCP
export const experimentalTools = [
  {
    name: 'getInferredInterestsById',
    description: 'Fetch inferred interests for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getInferredInterestsByIdSchema),
    handler: async (params: z.infer<typeof getInferredInterestsByIdSchema>) => {
      return await defaultExperimentalService.getInferredInterestsById(params.hash);
    }
  },
  {
    name: 'getInferredInterestsByEmail',
    description: 'Fetch inferred interests for a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getInferredInterestsByEmailSchema),
    handler: async (params: z.infer<typeof getInferredInterestsByEmailSchema>) => {
      return await defaultExperimentalService.getInferredInterestsByEmail(params.email);
    }
  }
];
