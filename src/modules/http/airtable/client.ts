import axios, { AxiosInstance } from 'axios';
import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import { ConfigService } from '../../configuration';
import { BaseHttpClient } from '../base';

import {
  AirtableCreateRecordRequest,
  AirtableListOptions,
  AirtableListResponse,
  AirtableRecord,
  AirtableUpdateRecordRequest,
} from './dto';

@Service()
export default class AirtableHttpClient extends BaseHttpClient {
  constructor(
    @Inject() protected configService: ConfigService,
    @Inject(diConstants.logger) protected logger: MonoLogger,
  ) {
    const airtableApiBaseUrl = configService.getRequired('airtableApiBaseUrl');
    const apiKey = configService.getRequired('airtableApiKey');

    const axiosInstance: AxiosInstance = axios.create({
      baseURL: airtableApiBaseUrl,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    });
    super(configService, logger, axiosInstance);
  }

  private getPath(baseId: string, tableIdOrName: string, recordId?: string): string {
    let path = `/${baseId}/${tableIdOrName}`;
    if (recordId) {
      path += `/${recordId}`;
    }
    return path;
  }

  /**
   * Creates a new record in the specified table.
   * @param baseId The ID of the base.
   * @param tableIdOrName The ID or name of the table.
   * @param data The data for the new record.
   * @returns The created record.
   */
  async createRecord<TFields>(
    baseId: string,
    tableIdOrName: string,
    data: AirtableCreateRecordRequest<TFields>,
  ): Promise<AirtableRecord<TFields> | null> {
    const path = this.getPath(baseId, tableIdOrName);
    this.logger.info(`Airtable API: Creating record in table ${tableIdOrName} of base ${baseId}`, {
      path,
      data,
    });
    const response = await this.request<AirtableRecord<TFields>>({
      method: 'POST',
      url: path,
      data,
    });

    if (response.status !== 200 && response.status !== 201) {
      this.logger.error('Failed to create Airtable record', {
        status: response.status,
        responseData: response.data,
      });
      return null;
    }
    return response.data;
  }

  /**
   * Retrieves a record by its ID from the specified table.
   * @param baseId The ID of the base.
   * @param tableIdOrName The ID or name of the table.
   * @param recordId The ID of the record to retrieve.
   * @returns The retrieved record, or null if not found or an error occurs.
   */
  async getRecord<TFields>(
    baseId: string,
    tableIdOrName: string,
    recordId: string,
  ): Promise<AirtableRecord<TFields> | null> {
    const path = this.getPath(baseId, tableIdOrName, recordId);
    this.logger.info(
      `Airtable API: Getting record ${recordId} from table ${tableIdOrName} of base ${baseId}`,
      { path },
    );
    const response = await this.request<AirtableRecord<TFields>>({
      method: 'GET',
      url: path,
    });

    if (response.status !== 200) {
      this.logger.warn('Failed to get Airtable record or record not found', {
        status: response.status,
        path,
      });
      return null;
    }
    return response.data;
  }

  /**
   * Updates an existing record in the specified table.
   * Uses PATCH for partial updates.
   * @param baseId The ID of the base.
   * @param tableIdOrName The ID or name of the table.
   * @param recordId The ID of the record to update.
   * @param data The data to update the record with.
   * @returns The updated record.
   */
  async updateRecord<TFields>(
    baseId: string,
    tableIdOrName: string,
    recordId: string,
    data: AirtableUpdateRecordRequest<TFields>,
  ): Promise<AirtableRecord<TFields> | null> {
    const path = this.getPath(baseId, tableIdOrName, recordId);
    this.logger.info(
      `Airtable API: Updating record ${recordId} in table ${tableIdOrName} of base ${baseId}`,
      { path, data },
    );
    const response = await this.request<AirtableRecord<TFields>>({
      method: 'PATCH',
      url: path,
      data,
    });

    if (response.status !== 200) {
      this.logger.error('Failed to update Airtable record', {
        status: response.status,
        responseData: response.data,
      });
      return null;
    }
    return response.data;
  }

  /**
   * Lists records from the specified table.
   * @param baseId The ID of the base.
   * @param tableIdOrName The ID or name of the table.
   * @param options Optional query parameters for listing records (e.g., pagination, filtering).
   * @returns A list of records and an optional offset for pagination.
   */
  async listRecords<TFields>(
    baseId: string,
    tableIdOrName: string,
    options?: AirtableListOptions,
  ): Promise<AirtableListResponse<TFields> | null> {
    const path = this.getPath(baseId, tableIdOrName);
    this.logger.info(
      `Airtable API: Listing records from table ${tableIdOrName} of base ${baseId}`,
      { path, options },
    );

    // Airtable expects query parameters directly, not nested under a 'params' object in
    // axios config for GET if they are complex.
    // BaseHttpClient's request method should handle passing 'params' to axios correctly.
    const response = await this.request<AirtableListResponse<TFields>>({
      method: 'GET',
      url: path,
      params: options,
    });

    if (response.status !== 200) {
      this.logger.error('Failed to list Airtable records', {
        status: response.status,
        responseData: response.data,
      });
      return null;
    }
    return response.data;
  }
}
