import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import {
  validateEmail,
  validateHash,
  generateIdentifierFromEmail,
  getUserAgent,
} from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import { DefaultAvatarOption, Rating } from '../common/types.js';
import type { IAvatarService } from './interfaces.js';

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

// Implement the AvatarService
export class AvatarService implements IAvatarService {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async getAvatarById(
    hash: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer> {
    try {
      console.error(
        `AvatarService.getAvatarById called with hash: ${hash}, size: ${size}, defaultOption: ${defaultOption}, forceDefault: ${forceDefault}, rating: ${rating}`,
      );

      // Validate hash
      if (!validateHash(hash)) {
        console.error(`Invalid hash format: ${hash}`);
        throw new GravatarValidationError('Invalid hash format');
      }

      // Build avatar URL
      let url = `https://secure.gravatar.com/avatar/${hash}`;

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

      console.error(`Making request to URL: ${url}`);

      // Fetch the image from the URL with User-Agent header
      const response = await this.fetchFn(url, {
        headers: {
          'User-Agent': getUserAgent(),
        },
      });

      console.error(`Received response with status: ${response.status} ${response.statusText}`);

      if (!response.ok) {
        console.error(`Failed to fetch avatar: ${response.statusText}`);
        throw new GravatarValidationError(`Failed to fetch avatar: ${response.statusText}`);
      }

      // Convert the response to a buffer
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      console.error(`Successfully converted response to buffer of size: ${buffer.length} bytes`);
      return buffer;
    } catch (error) {
      console.error(`Error getting avatar for hash ${hash}:`, error);
      throw error;
    }
  }

  async getAvatarByEmail(
    email: string,
    size?: number,
    defaultOption?: DefaultAvatarOption,
    forceDefault?: boolean,
    rating?: Rating,
  ): Promise<Buffer> {
    try {
      console.error(
        `AvatarService.getAvatarByEmail called with email: ${email}, size: ${size}, defaultOption: ${defaultOption}, forceDefault: ${forceDefault}, rating: ${rating}`,
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

// Factory function to create the service with optional fetch implementation
export function createAvatarService(fetchFn?: typeof fetch): IAvatarService {
  return new AvatarService(fetchFn || fetch);
}

// Default instance for convenience
export const defaultAvatarService = createAvatarService();

// Tool definitions for MCP
export const avatarTools = [
  {
    name: 'getAvatarById',
    description:
      'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getAvatarByIdSchema),
    handler: async (params: z.infer<typeof getAvatarByIdSchema>) => {
      return await defaultAvatarService.getAvatarById(
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
      return await defaultAvatarService.getAvatarByEmail(
        params.email,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating,
      );
    },
  },
];
