import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { AvatarImageApi } from './avatar-image-api.js';
import { serverConfig, ApiConfigType } from '../config/server-config.js';
import type { IProfilesApiClient, IExperimentalApiClient } from './interfaces.js';

export interface ApiClient {
  profiles: IProfilesApiClient;
  experimental: IExperimentalApiClient;
  avatars: AvatarImageApi;
}

/**
 * Creates and configures all API clients
 * @returns An object containing all configured API clients
 */
export async function createApiClient(): Promise<ApiClient> {
  const [restConfig, avatarConfig] = await Promise.all([
    serverConfig.createApiConfiguration(ApiConfigType.RestApi),
    serverConfig.createApiConfiguration(ApiConfigType.AvatarImageApi),
  ]);

  return {
    profiles: new ProfilesApi(restConfig),
    experimental: new ExperimentalApi(restConfig),
    avatars: new AvatarImageApi(avatarConfig),
  };
}
