import 'reflect-metadata';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { MonoLogger } from '@withmono/logger';

import { generateMockObject, getMockLogger, testgen } from '../../../test/util';
import { ConfigService } from '../../configuration';
import AirtableHttpClient from '../../http/airtable/client';
import { FounderGender, StartupStage, StartupStatus } from '../dto';
import StartupRepository from '../startup.repository';

jest.mock('../../http/airtable/client');
jest.mock('../../configuration');

describe(StartupRepository.name, () => {
  let repository: StartupRepository;
  let airtableClient: jest.Mocked<AirtableHttpClient>;
  let configService: jest.Mocked<ConfigService>;
  let logger: jest.Mocked<MonoLogger>;

  beforeEach(() => {
    logger = getMockLogger();
    airtableClient = generateMockObject('createRecord', 'getRecord', 'updateRecord', 'listRecords');
    configService = generateMockObject('getRequired');

    configService.getRequired.mockImplementation((key: string) => {
      if (key === 'airtableBaseId') return 'test-base-id';
      if (key === 'airtableStartupsTableId') return 'test-table-id';
      return 'test-value';
    });

    repository = new StartupRepository(airtableClient, configService, logger);
  });

  describe('createStartup', () => {
    it('should successfully create a startup record in Airtable', async () => {
      // arrange
      const submission = testgen.startupSubmission();
      const airtableRecord = testgen.airtableStartupRecord({
        id: 'rec123456789',
      });

      airtableClient.createRecord.mockResolvedValue(airtableRecord);

      // act
      const result = await repository.createStartup(submission);

      // assert
      expect(result).toBe('rec123456789');
      expect(airtableClient.createRecord).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        expect.objectContaining({
          fields: expect.objectContaining({
            Name: submission.name,
            Description: submission.description,
            Website: submission.website,
            Status: StartupStatus.PENDING,
            'View Count': 0,
            'Upvote Count': 0,
          }),
        }),
      );
    });

    it('should throw error when Airtable record creation fails', async () => {
      // arrange
      const submission = testgen.startupSubmission();
      airtableClient.createRecord.mockResolvedValue(null);

      // act & assert
      await expect(repository.createStartup(submission)).rejects.toThrow(
        'Failed to create startup record',
      );
    });

    it('should map all submission fields correctly to Airtable format', async () => {
      // arrange
      const submission = testgen.startupSubmission({
        stage: StartupStage.GROWTH,
        founderGender: FounderGender.FEMALE,
        isStudentBuild: true,
        tags: ['EdTech', 'SaaS'],
      });
      const airtableRecord = testgen.airtableStartupRecord();

      airtableClient.createRecord.mockResolvedValue(airtableRecord);

      // act
      await repository.createStartup(submission);

      // assert
      expect(airtableClient.createRecord).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        expect.objectContaining({
          fields: expect.objectContaining({
            Stage: StartupStage.GROWTH,
            'Founder Gender': FounderGender.FEMALE,
            'Student Build': true,
            Tags: ['EdTech', 'SaaS'].map((x) => x.trim().toLowerCase()).join(', '),
          }),
        }),
      );
    });
  });

  describe('getStartupById', () => {
    it('should return startup DTO when record exists', async () => {
      // arrange
      const startupId = 'rec123456789';
      const airtableRecord = testgen.airtableStartupRecord({ id: startupId });
      airtableClient.getRecord.mockResolvedValue(airtableRecord);

      // act
      const result = await repository.getStartupById(startupId);

      // assert
      expect(result).toBeDefined();
      expect(result?.id).toBe(startupId);
      expect(result?.name).toBe(airtableRecord.fields.Name);
      expect(result?.status).toBe(StartupStatus.APPROVED);
    });

    it('should return admin startup DTO when includePrivateFields is true', async () => {
      // arrange
      const startupId = 'rec123456789';
      const airtableRecord = testgen.airtableStartupRecord({ id: startupId });
      airtableClient.getRecord.mockResolvedValue(airtableRecord);

      // act
      const result = await repository.getStartupById(startupId, true);

      // assert
      expect(result).toBeDefined();
      expect(result!.contactEmail).toBe(airtableRecord.fields['Contact Email']);
      expect(result!.pitchDeck).toBe(airtableRecord.fields['Pitch Deck']);
      expect(result!.adminNotes).toBe(airtableRecord.fields['Admin Notes']);
    });

    it('should return null when record does not exist', async () => {
      // arrange
      const startupId = 'nonexistent';
      airtableClient.getRecord.mockResolvedValue(null);

      // act
      const result = await repository.getStartupById(startupId);

      // assert
      expect(result).toBeNull();
    });
  });

  describe('listPublicStartups', () => {
    it('should return approved startups with correct filtering', async () => {
      // arrange
      const query = testgen.startupQuery({
        sector: 'Fintech',
        stage: StartupStage.MVP,
      });
      const airtableResponse = {
        records: [
          testgen.airtableStartupRecord(),
          testgen.airtableStartupRecord({ id: 'rec987654321' }),
        ],
      };
      airtableClient.listRecords.mockResolvedValue(airtableResponse);

      // act
      const result = await repository.listPublicStartups(query);

      // assert
      expect(result.startups).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(airtableClient.listRecords).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        expect.objectContaining({
          filterByFormula: expect.stringContaining('Status') && expect.stringContaining('approved'),
          sort: [{ field: 'Created At', direction: 'desc' }],
        }),
      );
    });

    it('should handle search query filtering', async () => {
      // arrange
      const query = testgen.startupQuery({
        searchQuery: 'fintech',
      });
      const airtableResponse = { records: [] };
      airtableClient.listRecords.mockResolvedValue(airtableResponse);

      // act
      await repository.listPublicStartups(query);

      // assert
      expect(airtableClient.listRecords).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        expect.objectContaining({
          filterByFormula: expect.stringContaining('fintech'),
        }),
      );
    });

    it('should return empty array when no records found', async () => {
      // arrange
      const query = testgen.startupQuery();
      airtableClient.listRecords.mockResolvedValue(null);

      // act
      const result = await repository.listPublicStartups(query);

      // assert
      expect(result.startups).toEqual([]);
      expect(result.total).toBe(0);
    });
  });

  describe('listAdminStartups', () => {
    it('should return startups with admin details', async () => {
      // arrange
      const query = testgen.adminStartupQuery({
        status: StartupStatus.PENDING,
      });
      const airtableResponse = {
        records: [testgen.airtableStartupRecord()],
      };
      airtableClient.listRecords.mockResolvedValue(airtableResponse);

      // act
      const result = await repository.listAdminStartups(query);

      // assert
      expect(result.startups).toHaveLength(1);
      expect(result.startups[0]).toHaveProperty('contactEmail');
      expect(result.startups[0]).toHaveProperty('pitchDeck');
      expect(airtableClient.listRecords).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        expect.objectContaining({
          filterByFormula: expect.stringContaining('pending'),
        }),
      );
    });

    it('should handle filtering by status', async () => {
      // arrange
      const query = testgen.adminStartupQuery({
        status: StartupStatus.REJECTED,
      });
      const airtableResponse = { records: [] };
      airtableClient.listRecords.mockResolvedValue(airtableResponse);

      // act
      await repository.listAdminStartups(query);

      // assert
      expect(airtableClient.listRecords).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        expect.objectContaining({
          filterByFormula: expect.stringContaining('rejected'),
        }),
      );
    });
  });

  describe('updateStartup', () => {
    it('should successfully update startup status and admin notes', async () => {
      // arrange
      const startupId = 'rec123456789';
      const status = StartupStatus.APPROVED;
      const adminNotes = 'Approved after review';
      const updatedRecord = testgen.airtableStartupRecord({
        id: startupId,
        fields: { Status: status, 'Admin Notes': adminNotes },
      });

      airtableClient.updateRecord.mockResolvedValue(updatedRecord);

      // act
      const result = await repository.updateStartup(startupId, status, adminNotes);

      // assert
      expect(result).toBeDefined();
      expect(result?.status).toBe(status);
      expect(airtableClient.updateRecord).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        startupId,
        expect.objectContaining({
          fields: expect.objectContaining({
            Status: status,
            'Admin Notes': adminNotes,
            'Updated At': expect.any(String),
          }),
        }),
      );
    });

    it('should return null when update fails', async () => {
      // arrange
      const startupId = 'rec123456789';
      airtableClient.updateRecord.mockResolvedValue(null);

      // act
      const result = await repository.updateStartup(startupId, StartupStatus.APPROVED);

      // assert
      expect(result).toBeNull();
    });
  });

  describe('incrementViewCount', () => {
    it('should successfully increment view count', async () => {
      // arrange
      const startupId = 'rec123456789';
      const existingRecord = testgen.airtableStartupRecord({
        id: startupId,
        fields: { 'View Count': 10 },
      });

      airtableClient.getRecord.mockResolvedValue(existingRecord);
      airtableClient.updateRecord.mockResolvedValue(existingRecord);

      // act
      await repository.incrementViewCount(startupId);

      // assert
      expect(airtableClient.updateRecord).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        startupId,
        expect.objectContaining({
          fields: {
            'View Count': 11,
          },
        }),
      );
    });

    it('should handle missing view count field', async () => {
      // arrange
      const startupId = 'rec123456789';
      const existingRecord = testgen.airtableStartupRecord({
        id: startupId,
        fields: { 'View Count': undefined as unknown as number },
      });

      airtableClient.getRecord.mockResolvedValue(existingRecord);
      airtableClient.updateRecord.mockResolvedValue(existingRecord);

      // act
      await repository.incrementViewCount(startupId);

      // assert
      expect(airtableClient.updateRecord).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        startupId,
        expect.objectContaining({
          fields: {
            'View Count': 1,
          },
        }),
      );
    });

    it('should throw error when startup not found', async () => {
      // arrange
      const startupId = 'nonexistent';
      airtableClient.getRecord.mockResolvedValue(null);

      // act & assert
      await expect(repository.incrementViewCount(startupId)).rejects.toThrow('Startup not found');
    });
  });

  describe('updateUpvoteCount', () => {
    it('should successfully update upvote count', async () => {
      // arrange
      const startupId = 'rec123456789';
      const newCount = 42;

      airtableClient.updateRecord.mockResolvedValue(testgen.airtableStartupRecord());

      // act
      await repository.updateUpvoteCount(startupId, newCount);

      // assert
      expect(airtableClient.updateRecord).toHaveBeenCalledWith(
        'test-base-id',
        'test-table-id',
        startupId,
        expect.objectContaining({
          fields: {
            'Upvote Count': newCount,
          },
        }),
      );
    });
  });
});
