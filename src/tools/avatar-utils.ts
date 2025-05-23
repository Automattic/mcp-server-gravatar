import { validateHash } from '../common/utils.js';
import { getUserAgent } from '../config/server-config.js';
import { GravatarValidationError } from '../common/errors.js';
import type { DefaultAvatarOption } from '../common/types.js';
import type { Rating } from '../generated/gravatar-api/models/Rating.js';

export interface AvatarParams {
  avatarIdentifier: string;
  size?: number;
  defaultOption?: DefaultAvatarOption;
  forceDefault?: boolean;
  rating?: Rating;
}

/**
 * Fetch avatar image by identifier
 */
export async function fetchAvatar(params: AvatarParams): Promise<Buffer> {
  if (!validateHash(params.avatarIdentifier)) {
    throw new GravatarValidationError('Invalid identifier format');
  }

  // Build avatar URL
  let url = `https://gravatar.com/avatar/${params.avatarIdentifier}`;
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
