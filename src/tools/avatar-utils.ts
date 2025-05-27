import { getUserAgent } from '../config/server-config.js';

export interface AvatarParams {
  avatarIdentifier: string;
  size?: number;
  defaultOption?: string;
  forceDefault?: boolean;
  rating?: string;
}

/**
 * Fetch avatar image by identifier
 */
export async function fetchAvatar(params: AvatarParams): Promise<Buffer> {
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
    // Provide specific error messages for common cases
    let message: string;
    switch (response.status) {
      case 404:
        message = `No avatar found for identifier: ${params.avatarIdentifier}.`;
        break;
      case 400:
        message = `Invalid avatar request parameters for identifier: ${params.avatarIdentifier}. Check the identifier format and parameters.`;
        break;
      case 403:
        message = `Avatar access denied for identifier: ${params.avatarIdentifier}`;
        break;
      case 429:
        message = `Rate limit exceeded. Please try again later.`;
        break;
      default:
        message = `Failed to fetch avatar (${response.status}): ${response.statusText}`;
    }
    throw new Error(message);
  }

  // Convert the response to a buffer
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
