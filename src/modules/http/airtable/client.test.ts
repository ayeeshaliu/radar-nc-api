import 'reflect-metadata';
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import axios, { AxiosInstance } from 'axios'; // Import axios and types

import { MonoLogger } from '@withmono/logger';

import {
  generateMockObject,
  getMockLogger,
  mockAxiosCreate,
  mockAxiosRequest, // Add this import
  mockReturnValueForParams,
} from '../../../test/util';
import { ConfigService } from '../../configuration';

import AirtableHttpClient from './client';
import {
  AirtableCreateRecordRequest,
  AirtableListOptions,
  AirtableListResponse,
  AirtableRecord,
  AirtableUpdateRecordRequest,
} from './dto';

jest.mock('axios'); // Mock axios module

interface SampleFields {
  name: string;
  value: number;
  tags?: string[];
}

describe('AirtableHttpClient', () => {
  let client: AirtableHttpClient;
  let mockConfigService: jest.Mocked<ConfigService>;
  let mockLogger: jest.Mocked<MonoLogger>;
  let mockAxiosClient: jest.Mocked<AxiosInstance>;

  const baseId = 'appTestBaseId';
  const tableIdOrName = 'tblTestTableId';
  const recordId = 'recTestRecordId';
  const airtableApiBaseUrl = 'https://api.airtable.com/v0';
  const airtableApiKey = 'testApiKey';

  beforeEach(() => {
    // arrange
    jest.clearAllMocks();

    mockLogger = getMockLogger();
    mockConfigService = generateMockObject<ConfigService>('getRequired', 'isDebugMode');
    mockAxiosClient = mockAxiosCreate();

    mockReturnValueForParams(mockConfigService.getRequired, [
      {
        condition: (a) => a === 'airtableApiKey',
        returnValue: airtableApiKey,
      },
      {
        condition: (a) => a === 'airtableApiBaseUrl',
        returnValue: airtableApiBaseUrl,
      },
    ]);

    client = new AirtableHttpClient(mockConfigService, mockLogger);
  });

  describe('constructor', () => {
    test('should initialize BaseHttpClient with correct Axios instance', () => {
      // assert
      expect(mockConfigService.getRequired).toHaveBeenCalledWith('airtableApiBaseUrl');
      expect(mockConfigService.getRequired).toHaveBeenCalledWith('airtableApiKey');
      expect(axios.create).toHaveBeenCalledWith({
        baseURL: airtableApiBaseUrl,
        headers: {
          Authorization: `Bearer ${airtableApiKey}`,
          'Content-Type': 'application/json',
        },
      });
    });
  });

  describe('createRecord', () => {
    const createData: AirtableCreateRecordRequest<SampleFields> = {
      fields: { name: 'Test Item', value: 100 },
      typecast: true,
    };
    const expectedRecord: AirtableRecord<SampleFields> = {
      id: recordId,
      createdTime: new Date().toISOString(),
      fields: createData.fields,
    };
    const requestPath = `/${baseId}/${tableIdOrName}`;

    test('should create a record successfully (Airtable returns 200)', async () => {
      // arrange
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`POST ${requestPath}`, { status: 200, data: expectedRecord }]]),
      );

      // act
      const result = await client.createRecord<SampleFields>(baseId, tableIdOrName, createData);

      // assert
      expect(result).toEqual(expectedRecord);
      expect(mockAxiosClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: requestPath,
          data: createData,
        }),
      );
    });

    test('should create a record successfully (Airtable returns 201)', async () => {
      // arrange
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`POST ${requestPath}`, { status: 201, data: expectedRecord }]]),
      );

      // act
      const result = await client.createRecord<SampleFields>(baseId, tableIdOrName, createData);

      // assert
      expect(result).toEqual(expectedRecord);
      expect(mockAxiosClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'POST',
          url: requestPath,
          data: createData,
        }),
      );
    });

    test('should return null if API call returns non-200/201 status', async () => {
      // arrange
      const errorResponse = { error: 'Server Error' };
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`POST ${requestPath}`, { status: 500, data: errorResponse }]]),
      );

      // act
      const result = await client.createRecord<SampleFields>(baseId, tableIdOrName, createData);

      // assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to create Airtable record',
        expect.objectContaining({ status: 500, responseData: errorResponse }),
      );
    });

    test('should rethrow if axiosInstance.request rejects (simulating network error)', async () => {
      // arrange
      const networkError = new Error('Network problem');
      mockAxiosClient.request.mockRejectedValue(networkError);

      // act & assert
      await expect(
        client.createRecord<SampleFields>(baseId, tableIdOrName, createData),
      ).rejects.toThrow(networkError);
      // BaseHttpClient is expected to handle logging for direct rejections if any.
    });
  });

  describe('getRecord', () => {
    const expectedRecord: AirtableRecord<SampleFields> = {
      id: recordId,
      createdTime: new Date().toISOString(),
      fields: { name: 'Test Item', value: 100 },
    };
    const requestPath = `/${baseId}/${tableIdOrName}/${recordId}`;

    test('should retrieve a record successfully', async () => {
      // arrange
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`GET ${requestPath}`, { status: 200, data: expectedRecord }]]),
      );

      // act
      const result = await client.getRecord<SampleFields>(baseId, tableIdOrName, recordId);

      // assert
      expect(result).toEqual(expectedRecord);
      expect(mockAxiosClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: requestPath,
        }),
      );
    });

    test('should return null if record not found (API returns 404)', async () => {
      // arrange
      const errorResponse = { error: 'Not Found' };
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`GET ${requestPath}`, { status: 404, data: errorResponse }]]),
      );

      // act
      const result = await client.getRecord<SampleFields>(baseId, tableIdOrName, recordId);

      // assert
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to get Airtable record or record not found',
        expect.objectContaining({ status: 404, path: requestPath }),
      );
    });

    test('should return null if API call returns other non-200 status', async () => {
      // arrange
      const errorResponse = { error: 'Server Error' };
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`GET ${requestPath}`, { status: 500, data: errorResponse }]]),
      );

      // act
      const result = await client.getRecord<SampleFields>(baseId, tableIdOrName, recordId);

      // assert
      expect(result).toBeNull();
      expect(mockLogger.warn).toHaveBeenCalledWith(
        'Failed to get Airtable record or record not found',
        expect.objectContaining({ status: 500 }),
      );
    });

    test('should rethrow if axiosInstance.request rejects', async () => {
      // arrange
      const networkError = new Error('Network problem');
      mockAxiosClient.request.mockRejectedValue(networkError);

      // act & assert
      await expect(client.getRecord<SampleFields>(baseId, tableIdOrName, recordId)).rejects.toThrow(
        networkError,
      );
    });
  });

  describe('updateRecord', () => {
    const updateData: AirtableUpdateRecordRequest<SampleFields> = {
      fields: { value: 150, tags: ['updated'] },
      typecast: true,
    };
    const expectedRecord: AirtableRecord<SampleFields> = {
      id: recordId,
      createdTime: new Date().toISOString(),
      fields: { name: 'Test Item', value: 150, tags: ['updated'] },
    };
    const requestPath = `/${baseId}/${tableIdOrName}/${recordId}`;

    test('should update a record successfully', async () => {
      // arrange
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`PATCH ${requestPath}`, { status: 200, data: expectedRecord }]]),
      );

      // act
      const result = await client.updateRecord<SampleFields>(
        baseId,
        tableIdOrName,
        recordId,
        updateData,
      );

      // assert
      expect(result).toEqual(expectedRecord);
      expect(mockAxiosClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'PATCH',
          url: requestPath,
          data: updateData,
        }),
      );
    });

    test('should return null if API call returns non-200 status', async () => {
      // arrange
      const errorResponse = { error: 'Server Error' };
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`PATCH ${requestPath}`, { status: 500, data: errorResponse }]]),
      );

      // act
      const result = await client.updateRecord<SampleFields>(
        baseId,
        tableIdOrName,
        recordId,
        updateData,
      );

      // assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to update Airtable record',
        expect.objectContaining({ status: 500 }),
      );
    });

    test('should rethrow if axiosInstance.request rejects', async () => {
      // arrange
      const networkError = new Error('Network problem');
      mockAxiosClient.request.mockRejectedValue(networkError);

      // act & assert
      await expect(
        client.updateRecord<SampleFields>(baseId, tableIdOrName, recordId, updateData),
      ).rejects.toThrow(networkError);
    });
  });

  describe('listRecords', () => {
    const listOptions: AirtableListOptions = {
      pageSize: 10,
      filterByFormula: "{name} = 'Test'",
    };
    const record1: AirtableRecord<SampleFields> = {
      id: 'rec1',
      createdTime: new Date().toISOString(),
      fields: { name: 'Test Item 1', value: 10 },
    };
    const record2: AirtableRecord<SampleFields> = {
      id: 'rec2',
      createdTime: new Date().toISOString(),
      fields: { name: 'Test Item 2', value: 20 },
    };
    const expectedResponse: AirtableListResponse<SampleFields> = {
      records: [record1, record2],
      offset: 'itrNextOffset',
    };
    const requestPath = `/${baseId}/${tableIdOrName}`;

    test('should list records successfully with options', async () => {
      // arrange
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`GET ${requestPath}`, { status: 200, data: expectedResponse }]]),
      );

      // act
      const result = await client.listRecords<SampleFields>(baseId, tableIdOrName, listOptions);

      // assert
      expect(result).toEqual(expectedResponse);
      expect(mockAxiosClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: requestPath,
          params: listOptions,
        }),
      );
    });

    test('should list records successfully without options', async () => {
      // arrange
      const simplerResponse = { records: [record1] };
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`GET ${requestPath}`, { status: 200, data: simplerResponse }]]),
      );

      // act
      const result = await client.listRecords<SampleFields>(baseId, tableIdOrName);

      // assert
      expect(result).toEqual(simplerResponse);
      expect(mockAxiosClient.request).toHaveBeenCalledWith(
        expect.objectContaining({
          url: requestPath,
          params: undefined,
        }),
      );
    });

    test('should return null if API call returns non-200 status', async () => {
      // arrange
      const errorResponse = { error: 'Server Error' };
      mockAxiosRequest(
        mockAxiosClient,
        new Map([[`GET ${requestPath}`, { status: 500, data: errorResponse }]]),
      );

      // act
      const result = await client.listRecords<SampleFields>(baseId, tableIdOrName, listOptions);

      // assert
      expect(result).toBeNull();
      expect(mockLogger.error).toHaveBeenCalledWith(
        'Failed to list Airtable records',
        expect.objectContaining({ status: 500 }),
      );
    });

    test('should rethrow if axiosInstance.request rejects', async () => {
      // arrange
      const networkError = new Error('Network problem');
      mockAxiosClient.request.mockRejectedValue(networkError);

      // act & assert
      await expect(
        client.listRecords<SampleFields>(baseId, tableIdOrName, listOptions),
      ).rejects.toThrow(networkError);
    });
  });
});
