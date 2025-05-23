import { ProfilesApi } from '../generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../generated/gravatar-api/apis/ExperimentalApi.js';
import { AvatarImageApi } from './avatar-image-api.js';
import { serverConfig } from '../config/server-config.js';
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
  const config = await serverConfig.createApiConfiguration();
  return {
    profiles: new ProfilesApi(config),
    experimental: new ExperimentalApi(config),
    avatars: new AvatarImageApi(),
  };
}
