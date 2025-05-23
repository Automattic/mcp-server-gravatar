import { validateHash, getUserAgent } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import type { DefaultAvatarOption, Rating } from '../common/types.js';
import { apiConfig } from '../config/server-config.js';

export interface GetAvatarByIdParams {
  hash: string;
  size?: number;
  defaultOption?: DefaultAvatarOption;
  forceDefault?: boolean;
  rating?: Rating;
}

/**
 * API client for Gravatar avatar operations
 */
export class AvatarImageApi {
  /**
   * Get a Gravatar image by its identifier
   */
  async getAvatarById(params: GetAvatarByIdParams): Promise<Buffer> {
    if (!validateHash(params.hash)) {
      throw new GravatarValidationError('Invalid hash format');
    }

    // Build avatar URL
    let url = `${apiConfig.avatarBaseUrl}/${params.hash}`;
    const queryParams = new URLSearchParams();

    if (params.size) {
      queryParams.append('s', params.size.toString());
    }

    if (params.defaultOption) {
      queryParams.append('d', params.defaultOption);
    }

    if (params.forceDefault) {
      queryParams.append('f', 'y');
    }

    if (params.rating) {
      queryParams.append('r', params.rating);
    }

    // Add query string to URL if there are any parameters
    const queryString = queryParams.toString();
    if (queryString) {
      url += `?${queryString}`;
    }

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        'User-Agent': getUserAgent(),
      },
    });

    if (!response.ok) {
      throw new GravatarValidationError(`Failed to fetch avatar: ${response.statusText}`);
    }

    // Convert the response to a buffer
    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }
}
