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


import * as runtime from '../runtime.js';
import type {
  Interest,
} from '../models/index.js';
import {
    InterestFromJSON,
    InterestToJSON,
} from '../models/index.js';

export interface GetProfileInferredInterestsByIdRequest {
    profileIdentifier: string;
}

/**
 * ExperimentalApi - interface
 * 
 * @export
 * @interface ExperimentalApiInterface
 */
export interface ExperimentalApiInterface {
    /**
     * Returns a list of inferred interests based on known and public information about the profile.
     * @summary Get inferred interests for a profile given their identifier
     * @param {string} profileIdentifier This can either be an SHA256 hash of an email address or profile URL slug.
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof ExperimentalApiInterface
     */
    getProfileInferredInterestsByIdRaw(requestParameters: GetProfileInferredInterestsByIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Interest>>>;

    /**
     * Returns a list of inferred interests based on known and public information about the profile.
     * Get inferred interests for a profile given their identifier
     */
    getProfileInferredInterestsById(requestParameters: GetProfileInferredInterestsByIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Interest>>;

}

/**
 * 
 */
export class ExperimentalApi extends runtime.BaseAPI implements ExperimentalApiInterface {

    /**
     * Returns a list of inferred interests based on known and public information about the profile.
     * Get inferred interests for a profile given their identifier
     */
    async getProfileInferredInterestsByIdRaw(requestParameters: GetProfileInferredInterestsByIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Array<Interest>>> {
        if (requestParameters['profileIdentifier'] == null) {
            throw new runtime.RequiredError(
                'profileIdentifier',
                'Required parameter "profileIdentifier" was null or undefined when calling getProfileInferredInterestsById().'
            );
        }

        const queryParameters: any = {};

        const headerParameters: runtime.HTTPHeaders = {};

        if (this.configuration && this.configuration.accessToken) {
            const token = this.configuration.accessToken;
            const tokenString = await token("apiKey", []);

            if (tokenString) {
                headerParameters["Authorization"] = `Bearer ${tokenString}`;
            }
        }
        const response = await this.request({
            path: `/profiles/{profileIdentifier}/inferred-interests`.replace(`{${"profileIdentifier"}}`, encodeURIComponent(String(requestParameters['profileIdentifier']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.JSONApiResponse(response, (jsonValue) => jsonValue.map(InterestFromJSON));
    }

    /**
     * Returns a list of inferred interests based on known and public information about the profile.
     * Get inferred interests for a profile given their identifier
     */
    async getProfileInferredInterestsById(requestParameters: GetProfileInferredInterestsByIdRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Array<Interest>> {
        const response = await this.getProfileInferredInterestsByIdRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
