import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import type { MonoLogger } from '@withmono/logger';

import type { ConfigService } from '../../configuration';

import BaseHttpClient from './base-http-client';

/**
 * Base class for legacy internal HTTP clients. Legacy Internal HTTP clients communicate with
 * internal services using the legacy internal authentication mechanism, involving a single API
 * key. This class overrides request from the base class to ensure that internal requests are
 * properly authenticated.
 */
export default abstract class BaseLegacyInternalHttpClient extends BaseHttpClient {
  /**
   * Legacy API key used for internal service requests. Set this in the constructor of your
   * service if you are using the legacy API key approach.
   *
   * @protected
   */
  private readonly legacyApiKey: string;

  protected constructor(
    legacyApiKey: string,
    configService: ConfigService,
    logger: MonoLogger,
    http: AxiosInstance,
  ) {
    super(configService, logger, http, false);
    this.legacyApiKey = legacyApiKey;
  }

  /**
   * Send an HTTP request to an internal service using Axios. This function uses the legacy approach
   * where the service key is a single API key shared by all services. This function ensures
   * internal requests are properly authenticated and sends the request. It also logs the request
   * and response. This method will not throw HTTP status errors, you must check the status in your
   * implementation and determine the correct behaviour for your use-case based on the response.
   *
   * This method will throw any other errors that occur during the request. It will also throw if
   * it fails to authenticate the request.
   *
   * @param config Axios request config for the request
   */
  protected request<ResponseDataType = unknown, RequestDataType = unknown>(
    config: AxiosRequestConfig<RequestDataType>,
  ): Promise<AxiosResponse<ResponseDataType, RequestDataType>> {
    return super.request({
      headers: {
        'mono-sec-key': `legacy_internal_${this.legacyApiKey}`,
        ...config.headers,
      },
      ...config,
    });
  }
}
