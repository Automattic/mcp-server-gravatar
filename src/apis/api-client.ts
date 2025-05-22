import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { AvatarImageApi } from './avatar-image-api.js';
import { createApiConfiguration } from '../common/utils.js';

export interface ApiClient {
  profiles: ProfilesApi;
  experimental: ExperimentalApi;
  avatars: AvatarImageApi;
}

/**
 * Creates and configures all API clients
 * @returns An object containing all configured API clients
 */
export async function createApiClient(): Promise<ApiClient> {
  const config = await createApiConfiguration();
  return {
    profiles: new ProfilesApi(config),
    experimental: new ExperimentalApi(config),
    avatars: new AvatarImageApi(),
  };
}
