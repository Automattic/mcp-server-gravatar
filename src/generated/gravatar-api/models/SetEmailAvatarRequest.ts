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
/**
 * 
 * @export
 * @interface SetEmailAvatarRequest
 */
export interface SetEmailAvatarRequest {
    /**
     * The email SHA256 hash to set the avatar for.
     * @type {string}
     * @memberof SetEmailAvatarRequest
     */
    emailHash: string;
}

/**
 * Check if a given object implements the SetEmailAvatarRequest interface.
 */
export function instanceOfSetEmailAvatarRequest(value: object): value is SetEmailAvatarRequest {
    if (!('emailHash' in value) || value['emailHash'] === undefined) return false;
    return true;
}

export function SetEmailAvatarRequestFromJSON(json: any): SetEmailAvatarRequest {
    return SetEmailAvatarRequestFromJSONTyped(json, false);
}

export function SetEmailAvatarRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): SetEmailAvatarRequest {
    if (json == null) {
        return json;
    }
    return {
        
        'emailHash': json['email_hash'],
    };
}

export function SetEmailAvatarRequestToJSON(json: any): SetEmailAvatarRequest {
    return SetEmailAvatarRequestToJSONTyped(json, false);
}

export function SetEmailAvatarRequestToJSONTyped(value?: SetEmailAvatarRequest | null, ignoreDiscriminator: boolean = false): any {
    if (value == null) {
        return value;
    }

    return {
        
        'email_hash': value['emailHash'],
    };
}

