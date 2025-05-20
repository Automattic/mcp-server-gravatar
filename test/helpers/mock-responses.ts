import type { Profile } from '../../src/generated/gravatar-api/models/Profile';
import type { Interest } from '../../src/generated/gravatar-api/models/Interest';
import type { VerifiedAccount } from '../../src/generated/gravatar-api/models/VerifiedAccount';

/**
 * Creates a mock VerifiedAccount
 */
export function createMockVerifiedAccount(overrides?: Partial<VerifiedAccount>): VerifiedAccount {
  return {
    serviceType: 'github',
    serviceLabel: 'GitHub',
    serviceIcon: 'https://secure.gravatar.com/services/github/icon',
    url: 'https://github.com/testuser',
    isHidden: false,
    ...overrides,
  };
}

/**
 * Creates a mock Profile response
 */
export function createMockProfile(overrides?: Partial<Profile>): Profile {
  return {
    hash: 'test-hash',
    displayName: 'Test User',
    profileUrl: 'https://gravatar.com/testuser',
    avatarUrl: 'https://secure.gravatar.com/avatar/test-hash',
    avatarAltText: 'Test User Avatar',
    location: 'Test Location',
    description: 'Test Description',
    jobTitle: 'Test Job Title',
    company: 'Test Company',
    verifiedAccounts: [createMockVerifiedAccount()],
    pronunciation: 'Test Pronunciation',
    pronouns: 'they/them',
    ...overrides,
  };
}

/**
 * Creates a mock Interest array response
 */
export function createMockInterests(count = 2): Interest[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Interest ${i + 1}`,
  }));
}

/**
 * Creates a mock avatar buffer
 */
export function createMockAvatarBuffer(size = 10): Buffer {
  return Buffer.from(new ArrayBuffer(size));
}
