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

export interface GetQrCodeBySha256HashRequest {
    sha256Hash: string;
    size?: number;
    version?: string;
    utmMedium?: string;
    utmCampaign?: string;
    type?: string;
}

/**
 * QrCodeApi - interface
 * 
 * @export
 * @interface QrCodeApiInterface
 */
export interface QrCodeApiInterface {
    /**
     * Returns a QR code for an email address by the given SHA256 hash.
     * @summary Get QR code for an email address\' profile
     * @param {string} sha256Hash The SHA256 hash of the email address or profile URL slug.
     * @param {number} [size] The size of the QR code.
     * @param {string} [version] The version of the QR code.
     * @param {string} [utmMedium] The medium of the UTM parameters. Appended to the URL in the QR code.
     * @param {string} [utmCampaign] The campaign of the UTM parameters. Appended to the URL in the QR code.
     * @param {string} [type] The type of center icon to display (\&#39;user\&#39; for avatar, \&#39;gravatar\&#39; for logo, \&#39;none\&#39; for no icon).
     * @param {*} [options] Override http request option.
     * @throws {RequiredError}
     * @memberof QrCodeApiInterface
     */
    getQrCodeBySha256HashRaw(requestParameters: GetQrCodeBySha256HashRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Blob>>;

    /**
     * Returns a QR code for an email address by the given SHA256 hash.
     * Get QR code for an email address\' profile
     */
    getQrCodeBySha256Hash(requestParameters: GetQrCodeBySha256HashRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Blob>;

}

/**
 * 
 */
export class QrCodeApi extends runtime.BaseAPI implements QrCodeApiInterface {

    /**
     * Returns a QR code for an email address by the given SHA256 hash.
     * Get QR code for an email address\' profile
     */
    async getQrCodeBySha256HashRaw(requestParameters: GetQrCodeBySha256HashRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<runtime.ApiResponse<Blob>> {
        if (requestParameters['sha256Hash'] == null) {
            throw new runtime.RequiredError(
                'sha256Hash',
                'Required parameter "sha256Hash" was null or undefined when calling getQrCodeBySha256Hash().'
            );
        }

        const queryParameters: any = {};

        if (requestParameters['size'] != null) {
            queryParameters['size'] = requestParameters['size'];
        }

        if (requestParameters['version'] != null) {
            queryParameters['version'] = requestParameters['version'];
        }

        if (requestParameters['utmMedium'] != null) {
            queryParameters['utm_medium'] = requestParameters['utmMedium'];
        }

        if (requestParameters['utmCampaign'] != null) {
            queryParameters['utm_campaign'] = requestParameters['utmCampaign'];
        }

        if (requestParameters['type'] != null) {
            queryParameters['type'] = requestParameters['type'];
        }

        const headerParameters: runtime.HTTPHeaders = {};

        const response = await this.request({
            path: `/qr-code/{sha256_hash}`.replace(`{${"sha256_hash"}}`, encodeURIComponent(String(requestParameters['sha256Hash']))),
            method: 'GET',
            headers: headerParameters,
            query: queryParameters,
        }, initOverrides);

        return new runtime.BlobApiResponse(response);
    }

    /**
     * Returns a QR code for an email address by the given SHA256 hash.
     * Get QR code for an email address\' profile
     */
    async getQrCodeBySha256Hash(requestParameters: GetQrCodeBySha256HashRequest, initOverrides?: RequestInit | runtime.InitOverrideFunction): Promise<Blob> {
        const response = await this.getQrCodeBySha256HashRaw(requestParameters, initOverrides);
        return await response.value();
    }

}
