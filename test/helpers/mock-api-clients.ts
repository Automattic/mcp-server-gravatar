import { vi } from 'vitest';
import type { Profile } from '../../src/generated/gravatar-api/models/Profile';
import type { Interest } from '../../src/generated/gravatar-api/models/Interest';

// Minimal interfaces for API clients
export interface IProfilesApiClient {
  getProfileById(params: { profileIdentifier: string }): Promise<Profile>;
}

export interface IExperimentalApiClient {
  getProfileInferredInterestsById(params: { profileIdentifier: string }): Promise<Interest[]>;
}

// Mock factories
export function createMockProfilesApi(options?: {
  getProfileByIdResponse?: Profile;
  getProfileByIdError?: Error;
}): IProfilesApiClient {
  return {
    getProfileById: vi.fn().mockImplementation(async params => {
      if (options?.getProfileByIdError) {
        throw options.getProfileByIdError;
      }
      return (
        options?.getProfileByIdResponse || {
          hash: params.profileIdentifier,
          displayName: 'Test User',
          profileUrl: 'https://gravatar.com/testuser',
        }
      );
    }),
  };
}

export function createMockExperimentalApi(options?: {
  getProfileInferredInterestsByIdResponse?: Interest[];
  getProfileInferredInterestsByIdError?: Error;
}): IExperimentalApiClient {
  return {
    getProfileInferredInterestsById: vi.fn().mockImplementation(async _params => {
      if (options?.getProfileInferredInterestsByIdError) {
        throw options.getProfileInferredInterestsByIdError;
      }
      return (
        options?.getProfileInferredInterestsByIdResponse || [
          { name: 'Technology', confidence: 0.9 },
          { name: 'Programming', confidence: 0.8 },
        ]
      );
    }),
  };
}

export function createMockFetch(options?: {
  responseBuffer?: Buffer;
  responseError?: Error;
  responseStatus?: number;
}): typeof fetch {
  return vi.fn().mockImplementation(async () => {
    if (options?.responseError) {
      throw options.responseError;
    }

    const buffer = options?.responseBuffer || Buffer.from(new ArrayBuffer(10));

    return {
      ok: options?.responseStatus
        ? options.responseStatus >= 200 && options.responseStatus < 300
        : true,
      status: options?.responseStatus || 200,
      statusText: options?.responseStatus === 404 ? 'Not Found' : 'OK',
      arrayBuffer: async () => buffer.buffer,
    } as Response;
  });
}
