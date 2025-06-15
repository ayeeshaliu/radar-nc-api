import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

import type { MonoLogger } from '@withmono/logger';

import type { ConfigService } from '../../configuration';

/**
 * Base class for HTTP clients. This class provides methods for sending HTTP requests
 * to other services. It also ensures that requests are properly logged and are traceable.
 */
export default abstract class BaseHttpClient {
  protected constructor(
    protected readonly configService: ConfigService,
    protected readonly logger: MonoLogger,
    protected readonly http: AxiosInstance,
    private readonly isExternal: boolean = true,
  ) {}

  /**
   * Send an HTTP request to an external service using Axios. All axios requests should be
   * made through this function. This function ensures the request and response is properly
   * logged. This method will not throw HTTP status errors, you must check the status in your
   * implementation and determine the correct behaviour for your use-case based on the response.
   *
   * This method will throw any other errors that occur during the request.
   *
   * @param config Axios request config for the request
   */
  protected async request<ResponseDataType = unknown, RequestDataType = unknown>(
    config: AxiosRequestConfig<RequestDataType>,
  ): Promise<AxiosResponse<ResponseDataType, RequestDataType>> {
    const headers = {
      ...(config.data ? { 'content-type': 'application/json' } : {}),
      'trace-id': this.logger.context.traceId as string,
      // you can override the headers if you want. always use lowercase header names
      ...config.headers,
    };

    const type = this.isExternal ? 'External' : 'Internal';
    try {
      const response = await this.http.request({
        ...config,
        headers,
        validateStatus: () => true,
      });

      this.logger.info(`${type} HTTP request`, {
        request: {
          url: response.config.url,
          method: response.config.method,
          headers: this.configService.isDebugMode() ? response.config.headers : '<redacted>',
          data: response.config.data,
        },
        response: {
          status: response.status,
          headers: this.configService.isDebugMode()
            ? response.headers
            : {
                'content-type': response.headers['content-type'],
                'content-length': response.headers['content-length'],
                '...rest': '<redacted>',
              },
          data: response.data,
        },
      });
      return response;
    } catch (e) {
      this.logger.error(`${type} HTTP request failed`, e);
      throw e;
    }
  }
}
