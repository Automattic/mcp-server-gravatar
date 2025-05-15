import fetch from 'node-fetch';
import type { IAvatarApiAdapter } from './interfaces.js';
import type { DefaultAvatarOption, Rating } from '../../common/types.js';
import { apiConfig } from '../../config/server-config.js';
import { getUserAgent } from '../../common/utils.js';
import { GravatarValidationError } from '../../common/errors.js';

/**
 * Adapter for the Gravatar Legacy API
 * Implements direct fetch calls to the legacy avatar endpoint
 */
export class LegacyApiAdapter implements IAvatarApiAdapter {
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  /**
   * Get an avatar by its identifier (hash)
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
        `LegacyApiAdapter.getAvatarById called with hash: ${hash}, size: ${size}, defaultOption: ${defaultOption}, forceDefault: ${forceDefault}, rating: ${rating}`,
      );

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
}
