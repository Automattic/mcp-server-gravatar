import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';
import fetch from 'node-fetch';
import { validateEmail, validateHash, generateIdentifierFromEmail, getApiKey, mapHttpStatusToError } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import { DefaultAvatarOption, Rating, AvatarParams } from '../common/types.js';

// Schema for getAvatarById
export const getAvatarByIdSchema = z.object({
  hash: z.string().refine(validateHash, {
    message: 'Invalid hash format. Must be a 32-character (MD5) or 64-character (SHA256) hexadecimal string.'
  }),
  size: z.number().min(1).max(2048).optional(),
  defaultOption: z.nativeEnum(DefaultAvatarOption).optional(),
  forceDefault: z.boolean().optional(),
  rating: z.nativeEnum(Rating).optional()
});

// Schema for getAvatarByEmail
export const getAvatarByEmailSchema = z.object({
  email: z.string().refine(validateEmail, {
    message: 'Invalid email format.'
  }),
  size: z.number().min(1).max(2048).optional(),
  defaultOption: z.nativeEnum(DefaultAvatarOption).optional(),
  forceDefault: z.boolean().optional(),
  rating: z.nativeEnum(Rating).optional()
});


/**
 * Get avatar PNG image for a profile by hash
 * @param hash The profile hash
 * @param size The preferred size
 * @param defaultOption The default avatar option
 * @param forceDefault Whether to force the default avatar
 * @param rating The rating
 * @returns The avatar image as a Buffer
 */
export async function getAvatarById(
  hash: string,
  size?: number,
  defaultOption?: DefaultAvatarOption,
  forceDefault?: boolean,
  rating?: Rating
): Promise<Buffer> {
  try {
    // Validate hash
    if (!validateHash(hash)) {
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
    
    // Fetch the image from the URL
    const response = await fetch(url);
    if (!response.ok) {
      throw new GravatarValidationError(`Failed to fetch avatar: ${response.statusText}`);
    }
    
    // Convert the response to a buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    throw error;
  }
}

/**
 * Get avatar PNG image for a profile by email
 * @param email The email address
 * @param size The preferred size
 * @param defaultOption The default avatar option
 * @param forceDefault Whether to force the default avatar
 * @param rating The rating
 * @returns The avatar image as a Buffer
 */
export async function getAvatarByEmail(
  email: string,
  size?: number,
  defaultOption?: DefaultAvatarOption,
  forceDefault?: boolean,
  rating?: Rating
): Promise<Buffer> {
  try {
    // Validate email
    if (!validateEmail(email)) {
      throw new GravatarValidationError('Invalid email format');
    }

    // Generate identifier from email
    const identifier = generateIdentifierFromEmail(email);
    
    // Use getAvatarById to get the avatar URL
    return await getAvatarById(identifier, size, defaultOption, forceDefault, rating);
  } catch (error) {
    throw error;
  }
}


// Tool definitions for MCP
export const avatarTools = [
  {
    name: 'getAvatarById',
    description: 'Get the avatar PNG image for a Gravatar profile using a profile identifier (hash).',
    inputSchema: zodToJsonSchema(getAvatarByIdSchema),
    handler: async (params: z.infer<typeof getAvatarByIdSchema>) => {
      return await getAvatarById(
        params.hash,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating
      );
    }
  },
  {
    name: 'getAvatarByEmail',
    description: 'Get the avatar PNG image for a Gravatar profile using an email address.',
    inputSchema: zodToJsonSchema(getAvatarByEmailSchema),
    handler: async (params: z.infer<typeof getAvatarByEmailSchema>) => {
      return await getAvatarByEmail(
        params.email,
        params.size,
        params.defaultOption,
        params.forceDefault,
        params.rating
      );
    }
  }
];
