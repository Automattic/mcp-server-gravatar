import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import {
  validateEmail,
  validateHash,
  generateIdentifierFromEmail,
  getUserAgent,
} from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import { DefaultAvatarOption, Rating } from '../common/types.js';
import type { IGravatarImageService, FetchFunction } from './interfaces.js';
import { apiConfig } from '../config/server-config.js';

// Schema for getAvatarById
export const getAvatarByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message:
      'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.',
  }),
  size: z.preprocess(val => (val === '' ? undefined : val), z.number().min(1).max(2048).optional()),
  defaultOption: z.preprocess(
    val => (val === '' ? undefined : val),
    z.nativeEnum(DefaultAvatarOption).optional(),
  ),
  forceDefault: z.preprocess(val => {
    if (val === '') return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  rating: z.preprocess(val => (val === '' ? undefined : val), z.nativeEnum(Rating).optional()),
});

// Schema for getAvatarByEmail
export const getAvatarByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.',
  }),
  size: z.preprocess(val => (val === '' ? undefined : val), z.number().min(1).max(2048).optional()),
  defaultOption: z.preprocess(
    val => (val === '' ? undefined : val),
    z.nativeEnum(DefaultAvatarOption).optional(),
  ),
  forceDefault: z.preprocess(val => {
    if (val === '') return undefined;
    if (val === 'true') return true;
    if (val === 'false') return false;
    return val;
  }, z.boolean().optional()),
  rating: z.preprocess(val => (val === '' ? undefined : val), z.nativeEnum(Rating).optional()),
});

/**
 * Service for interacting with Gravatar images
 * Uses fetch directly to get avatar images
 */
export class GravatarImageService implements IGravatarImageService {
  constructor(private readonly gravatarImageApiClient: FetchFunction = fetch) {}

  /**
   * Get a Gravatar image by its identifier (hash)
   * @param hash The avatar identifier (MD5 or SHA256 hash)
   * @param size Optional size in pixels (1-2048)
   * @param defaultOption Optional default option if no avatar exists
   * @param forceDefault Optional flag to force the default option
   * @param rating Optional content rating filter
   * @returns The avatar image as a Buffer
   */
  async getAvatarById(
    hash: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer> {
    // Validate hash
    if (!validateHash(hash)) {
      throw new GravatarValidationError('Invalid hash format');
    }

    // Build avatar URL using the configured avatarBaseUrl
    let url = `${apiConfig.avatarBaseUrl}/${hash}`;

    // Add query parameters
    const queryParams = new URLSearchParams();

    if (size) {
      queryParams.append('s', size.toString());
    }

    if (defaultOption) {
      queryParams.append('d', defaultOption);
    }

    if (forceDefault) {
      queryParams.append('f', 'y');
    }

    if (rating) {
      queryParams.append('r', rating);
    }

    // Add query string to URL if there are any parameters
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    // Fetch the image from the URL with User-Agent header
    const response = await this.gravatarImageApiClient(url, {
      headers: {
        'User-Agent': getUserAgent(),
      },
    });

    if (!response.ok) {
      throw new GravatarValidationError(`Failed to fetch avatar: ${response.statusText}`);
    }

    // Convert the response to a buffer
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    return buffer;
  }

  /**
   * Get a Gravatar image by email address
   * @param email The email address
   * @param size Optional size in pixels (1-2048)
   * @param defaultOption Optional default option if no avatar exists
   * @param forceDefault Optional flag to force the default option
   * @param rating Optional content rating filter
   * @returns The avatar image as a Buffer
   */
  async getAvatarByEmail(
    email: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer> {
    // Validate email
    if (!validateEmail(email)) {
      throw new GravatarValidationError('Invalid email format');
    }

    // Generate identifier from email
    const identifier = generateIdentifierFromEmail(email);

    // Use getAvatarById to get the avatar
    return await this.getAvatarById(identifier, size, defaultOption, forceDefault, rating);
  }
}

/**
 * Factory function to create a GravatarImageService with the default fetch implementation
 * @returns A new GravatarImageService instance
 */
export function createGravatarImageService(): IGravatarImageService {
  return new GravatarImageService(fetch);
}

// Tool definitions for MCP
export const gravatarImageTools = [
  {
    name: 'getAvatarById',
    description:
      'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getAvatarByIdSchema),
    handler: async (params: z.infer<typeof getAvatarByIdSchema>) => {
      const service = createGravatarImageService();
      return await service.getAvatarById(
        params.hash,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
    },
  },
  {
    name: 'getAvatarByEmail',
    description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getAvatarByEmailSchema),
    handler: async (params: z.infer<typeof getAvatarByEmailSchema>) => {
      const service = createGravatarImageService();
      return await service.getAvatarByEmail(
        params.email,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
    },
  },
];
