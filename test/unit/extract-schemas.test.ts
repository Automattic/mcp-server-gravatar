import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';
import { camelizeKey, camelizeSchema } from '../../scripts/extract-schemas.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..', '..');

describe('camelizeKey', () => {
  it('converts lower_snake_case to lowerCamelCase', () => {
    expect(camelizeKey('display_name')).toBe('displayName');
    expect(camelizeKey('profile_url')).toBe('profileUrl');
    expect(camelizeKey('avatar_alt_text')).toBe('avatarAltText');
    expect(camelizeKey('number_verified_accounts')).toBe('numberVerifiedAccounts');
    expect(camelizeKey('contact_info')).toBe('contactInfo');
    expect(camelizeKey('crypto_wallets')).toBe('cryptoWallets');
    expect(camelizeKey('service_type')).toBe('serviceType');
    expect(camelizeKey('is_hidden')).toBe('isHidden');
  });

  it('leaves single-word keys unchanged', () => {
    expect(camelizeKey('hash')).toBe('hash');
    expect(camelizeKey('company')).toBe('company');
    expect(camelizeKey('url')).toBe('url');
    expect(camelizeKey('email')).toBe('email');
  });

  it('is idempotent on already-camelCase keys', () => {
    expect(camelizeKey('displayName')).toBe('displayName');
    expect(camelizeKey('profileUrl')).toBe('profileUrl');
    expect(camelizeKey('numberVerifiedAccounts')).toBe('numberVerifiedAccounts');
  });
});

describe('camelizeSchema', () => {
  it('renames object property keys and required entries', () => {
    const input = {
      type: 'object',
      required: ['display_name', 'profile_url', 'hash'],
      properties: {
        display_name: { type: 'string' },
        profile_url: { type: 'string', format: 'uri' },
        hash: { type: 'string' },
      },
    };
    const out = camelizeSchema(input);
    expect(out.required).toEqual(['displayName', 'profileUrl', 'hash']);
    expect(Object.keys(out.properties!)).toEqual(['displayName', 'profileUrl', 'hash']);
    // values preserved
    expect((out.properties!.profileUrl as { format: string }).format).toBe('uri');
  });

  it('recurses into nested object properties and their required arrays', () => {
    const input = {
      type: 'object',
      required: ['contact_info'],
      properties: {
        contact_info: {
          type: 'object',
          required: ['home_phone'],
          properties: {
            home_phone: { type: 'string' },
            contact_form: { type: 'string' },
          },
        },
      },
    };
    const out = camelizeSchema(input);
    expect(out.required).toEqual(['contactInfo']);
    const contactInfo = out.properties!.contactInfo as {
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(contactInfo.required).toEqual(['homePhone']);
    expect(Object.keys(contactInfo.properties)).toEqual(['homePhone', 'contactForm']);
  });

  it('recurses into array items subschemas', () => {
    const input = {
      type: 'object',
      properties: {
        verified_accounts: {
          type: 'array',
          items: {
            type: 'object',
            required: ['service_type', 'is_hidden'],
            properties: {
              service_type: { type: 'string' },
              is_hidden: { type: 'boolean' },
            },
          },
        },
      },
    };
    const out = camelizeSchema(input);
    const va = out.properties!.verifiedAccounts as {
      items: { required: string[]; properties: Record<string, unknown> };
    };
    expect(va.items.required).toEqual(['serviceType', 'isHidden']);
    expect(Object.keys(va.items.properties)).toEqual(['serviceType', 'isHidden']);
  });

  it('does not mutate $ref values', () => {
    const input = {
      type: 'object',
      properties: {
        verified_accounts: {
          type: 'array',
          items: { $ref: '#/components/schemas/VerifiedAccount' },
        },
      },
    };
    const out = camelizeSchema(input);
    const va = out.properties!.verifiedAccounts as { items: { $ref: string } };
    expect(va.items.$ref).toBe('#/components/schemas/VerifiedAccount');
  });

  it('is idempotent: applying twice equals applying once', () => {
    const input = {
      type: 'object',
      required: ['display_name'],
      properties: { display_name: { type: 'string' } },
    };
    const once = camelizeSchema(input);
    const twice = camelizeSchema(once);
    expect(twice).toEqual(once);
  });

  it('does not mutate the input object', () => {
    const input = {
      type: 'object',
      required: ['display_name'],
      properties: { display_name: { type: 'string' } },
    };
    camelizeSchema(input);
    expect(input.required).toEqual(['display_name']);
    expect(Object.keys(input.properties)).toEqual(['display_name']);
  });
});

describe('generated profile-output-schema.json', () => {
  // The runtime Profile object (from ProfileFromJSON) uses camelCase keys.
  // The generated output schema's required[] must match those keys exactly,
  // otherwise MCP structured-content validation rejects every profile fetch
  // with "'display_name' is a required property". See issue #58.
  const expectedRequiredCamel = [
    'hash',
    'displayName',
    'profileUrl',
    'avatarUrl',
    'avatarAltText',
    'location',
    'description',
    'jobTitle',
    'company',
    'verifiedAccounts',
    'pronunciation',
    'pronouns',
  ];

  it('lists camelCase keys in required[] matching ProfileFromJSON output', () => {
    const schemaPath = path.join(
      repoRoot,
      'src',
      'generated',
      'schemas',
      'profile-output-schema.json',
    );
    const schema = JSON.parse(readFileSync(schemaPath, 'utf8')) as {
      required: string[];
      properties: Record<string, unknown>;
    };
    expect(schema.required).toEqual(expectedRequiredCamel);
    // every required key must also be present as a property key
    for (const key of schema.required) {
      expect(Object.keys(schema.properties)).toContain(key);
    }
  });
});
