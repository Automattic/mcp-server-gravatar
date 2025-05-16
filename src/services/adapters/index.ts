// Export all adapter interfaces
export * from './interfaces.js';

// Export REST API adapter
export * from './rest-api-adapter.js';

// Export Legacy API adapter
export * from './legacy-api-adapter.js';

// Factory functions for creating adapters
import { ProfilesApi } from '../../generated/gravatar-api/apis/ProfilesApi.js';
import { ExperimentalApi } from '../../generated/gravatar-api/apis/ExperimentalApi.js';
import { createApiConfiguration } from '../../common/utils.js';
import { RestApiAdapter } from './rest-api-adapter.js';
import { LegacyApiAdapter } from './legacy-api-adapter.js';
import {
  IProfileApiAdapter,
  IExperimentalApiAdapter,
  IGravatarImageApiAdapter,
} from './interfaces.js';
import fetch from 'node-fetch';

/**
 * Create a REST API adapter with the default configuration
 * @returns A new RestApiAdapter instance
 */
export async function createRestApiAdapter(): Promise<
  IProfileApiAdapter & IExperimentalApiAdapter
> {
  const config = await createApiConfiguration();
  return new RestApiAdapter(new ProfilesApi(config), new ExperimentalApi(config));
}

/**
 * Create a Legacy API adapter with the default fetch implementation
 * @returns A new LegacyApiAdapter instance
 */
export function createLegacyApiAdapter(): IGravatarImageApiAdapter {
  return new LegacyApiAdapter(fetch);
}
