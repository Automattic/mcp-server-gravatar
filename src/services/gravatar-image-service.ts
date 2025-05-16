import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { validateEmail, validateHash, generateIdentifierFromEmail } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import { DefaultAvatarOption, Rating } from '../common/types.js';
import type { IAvatarService } from './interfaces.js';
import type { IGravatarImageApiAdapter } from './adapters/index.js';
import { createLegacyApiAdapter } from './adapters/index.js';

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
 * Uses the adapter pattern to abstract API implementation details
 */
export class GravatarImageService implements IAvatarService {
  constructor(private readonly adapter: IGravatarImageApiAdapter) {}

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
    try {
      console.error(
        `GravatarImageService.getAvatarById called with hash: ${hash}, size: ${size}, defaultOption: ${defaultOption}, forceDefault: ${forceDefault}, rating: ${rating}`,
      );

      // Validate hash
      if (!validateHash(hash)) {
        console.error(`Invalid hash format: ${hash}`);
        throw new GravatarValidationError('Invalid hash format');
      }

      // Use adapter to fetch the avatar
      console.error(`Using adapter to get avatar for hash: ${hash}`);
      const buffer = await this.adapter.getAvatarById(
        hash,
        size,
        defaultOption,
        forceDefault,
        rating,
      );
      console.error(`Successfully received buffer of size: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error(`Error getting avatar for hash ${hash}:`, error);
      throw error;
    }
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
    try {
      console.error(
        `GravatarImageService.getAvatarByEmail called with email: ${email}, size: ${size}, defaultOption: ${defaultOption}, forceDefault: ${forceDefault}, rating: ${rating}`,
      );

      // Validate email
      if (!validateEmail(email)) {
        console.error(`Invalid email format: ${email}`);
        throw new GravatarValidationError('Invalid email format');
      }

      // Generate identifier from email
      const identifier = generateIdentifierFromEmail(email);
      console.error(`Generated identifier from email: ${identifier}`);

      // Use getAvatarById to get the avatar
      return await this.getAvatarById(identifier, size, defaultOption, forceDefault, rating);
    } catch (error) {
      console.error(`Error getting avatar for email ${email}:`, error);
      throw error;
    }
  }
}

/**
 * Factory function to create a GravatarImageService with the default adapter
 * @returns A new GravatarImageService instance
 */
export function createGravatarImageService(): GravatarImageService {
  const adapter = createLegacyApiAdapter();
  return new GravatarImageService(adapter);
}

// For backward compatibility: maintain the singleton pattern
// but use the new adapter-based implementation internally
let _defaultGravatarImageService: GravatarImageService | null = null;

/**
 * Get or create the default GravatarImageService instance (singleton)
 * @returns The default GravatarImageService instance
 * @deprecated Use createGravatarImageService() instead
 */
export function getDefaultAvatarService(): IAvatarService {
  if (!_defaultGravatarImageService) {
    _defaultGravatarImageService = createGravatarImageService();
  }
  return _defaultGravatarImageService;
}

// For backward compatibility
export function createAvatarService(): IAvatarService {
  return createGravatarImageService();
}

// Tool definitions for MCP
export const gravatarImageTools = [
  {
    name: 'getAvatarById',
    description:
      'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getAvatarByIdSchema),
    handler: async (params: z.infer<typeof getAvatarByIdSchema>) => {
      const service = getDefaultAvatarService();
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
      const service = getDefaultAvatarService();
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
