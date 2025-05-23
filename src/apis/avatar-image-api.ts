import { validateHash } from '../common/utils.js';
import { GravatarValidationError } from '../common/errors.js';
import type { DefaultAvatarOption } from '../common/types.js';
import type { Rating } from '../generated/gravatar-api/models/Rating.js';
import type { Configuration } from '../generated/gravatar-api/runtime.js';

export interface GetAvatarByIdParams {
  avatarIdentifier: string;
  size?: number;
  defaultOption?: DefaultAvatarOption;
  forceDefault?: boolean;
  rating?: Rating;
}

/**
 * API client for Gravatar avatar operations
 */
export class AvatarImageApi {
  constructor(private configuration: Configuration) {}

  /**
   * Get a Gravatar image by its identifier
   */
  async getAvatarById(params: GetAvatarByIdParams): Promise<Buffer> {
    if (!validateHash(params.avatarIdentifier)) {
      throw new GravatarValidationError('Invalid identifier format');
    }

    // Get avatarBaseUrl from configuration basePath or use default
    const avatarBaseUrl = this.configuration.basePath || 'https://gravatar.com/avatar';

    // Build avatar URL
    let url = `${avatarBaseUrl}/${params.avatarIdentifier}`;
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

    // Get User-Agent from configuration headers
    const userAgent = this.configuration.headers?.['User-Agent'] || 'mcp-server-gravatar';

    // Fetch the image
    const response = await fetch(url, {
      headers: {
        'User-Agent': userAgent,
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
