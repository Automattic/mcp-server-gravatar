/* tslint:disable */
/* eslint-disable */
/**
 * Gravatar Public API
 * Gravatar\'s public API endpoints
 *
 * The version of the OpenAPI document: 3.0.0
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { mapValues } from '../runtime.js';
import type { CryptoWalletAddress } from './CryptoWalletAddress.js';
import {
    CryptoWalletAddressFromJSON,
    CryptoWalletAddressFromJSONTyped,
    CryptoWalletAddressToJSON,
    CryptoWalletAddressToJSONTyped,
} from './CryptoWalletAddress.js';
import type { Link } from './Link.js';
import {
    LinkFromJSON,
    LinkFromJSONTyped,
    LinkToJSON,
    LinkToJSONTyped,
} from './Link.js';

/**
 * The user's public payment information. This is only provided in authenticated API requests.
 * @export
 * @interface ProfilePayments
 */
export interface ProfilePayments {
    /**
     * A list of payment URLs the user has added to their profile.
     * @type {Array<Link>}
     * @memberof ProfilePayments
     */
    links: Array<Link>;
    /**
     * A list of crypto currencies the user accepts.
     * @type {Array<CryptoWalletAddress>}
     * @memberof ProfilePayments
     */
    cryptoWallets: Array<CryptoWalletAddress>;
}

/**
 * Check if a given object implements the ProfilePayments interface.
 */
export function instanceOfProfilePayments(value: object): value is ProfilePayments {
    if (!('links' in value) || value['links'] === undefined) return false;
    if (!('cryptoWallets' in value) || value['cryptoWallets'] === undefined) return false;
    return true;
}

export function ProfilePaymentsFromJSON(json: any): ProfilePayments {
    return ProfilePaymentsFromJSONTyped(json, false);
}

export function ProfilePaymentsFromJSONTyped(json: any, ignoreDiscriminator: boolean): ProfilePayments {
    if (json == null) {
        return json;
    }
    return {
        
        'links': ((json['links'] as Array<any>).map(LinkFromJSON)),
        'cryptoWallets': ((json['crypto_wallets'] as Array<any>).map(CryptoWalletAddressFromJSON)),
    };
}

export function ProfilePaymentsToJSON(json: any): ProfilePayments {
    return ProfilePaymentsToJSONTyped(json, false);
}

export function ProfilePaymentsToJSONTyped(value?: ProfilePayments | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'links': ((value['links'] as Array<any>).map(LinkToJSON)),
        'crypto_wallets': ((value['cryptoWallets'] as Array<any>).map(CryptoWalletAddressToJSON)),
    };
}

