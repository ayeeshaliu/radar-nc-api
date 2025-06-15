import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { MonoLogger } from '@withmono/logger';

import * as testgen from '../../../test/generator';
import { generateMockObject, getMockLogger } from '../../../test/util';
import { StartupStage, StartupStatus } from '../dto';
import StartupAnalyticsService from '../startup.analytics.service';
import StartupRepository from '../startup.repository';
import StartupsService from '../startups.service';

describe(StartupsService.name, () => {
  let service: StartupsService;
  let startupRepository: jest.Mocked<StartupRepository>;
  let analyticsService: jest.Mocked<StartupAnalyticsService>;
  let logger: MonoLogger;

  beforeEach(() => {
    logger = getMockLogger();

    startupRepository = generateMockObject('createStartup', 'listPublicStartups', 'getStartupById');

    analyticsService = generateMockObject('getStartupAnalytics');

    service = new StartupsService(startupRepository, analyticsService, logger);
  });

  describe('submitStartup', () => {
    it('should successfully submit a new startup', async () => {
      // Arrange
      const submission = testgen.startupSubmission({
        name: 'TechCorp',
        description: 'AI-powered fintech solution',
        email: 'founder@techcorp.com',
      });
      const createdStartupId = 'startup-123';

      startupRepository.createStartup.mockResolvedValue(createdStartupId);

      // Act
      const result = await service.submitStartup(submission);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startup submitted successfully and is pending review',
        data: { id: createdStartupId },
      });
      expect(startupRepository.createStartup).toHaveBeenCalledWith(submission);
      expect(logger.info).toHaveBeenCalledWith('Submitting new startup', { name: submission.name });
      expect(logger.info).toHaveBeenCalledWith('Startup submitted successfully', {
        id: createdStartupId,
        name: submission.name,
        founderEmail: submission.email,
      });
    });

    it('should handle repository errors during submission', async () => {
      // Arrange
      const submission = testgen.startupSubmission();
      const error = new Error('Database connection failed');

      startupRepository.createStartup.mockRejectedValue(error);

      // Act & Assert
      await expect(service.submitStartup(submission)).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to submit startup', { error, submission });
    });
  });

  describe('getPublicStartups', () => {
    it('should successfully retrieve public startups', async () => {
      // Arrange
      const query = testgen.startupQuery({
        sector: 'Fintech',
        limit: 10,
        offset: 0,
      });

      const mockResult = {
        startups: [
          testgen.startup({
            id: 'startup-1',
            name: 'Fintech Corp',
            sector: 'Fintech',
          }),
          testgen.startup({
            id: 'startup-2',
            name: 'Tech Solutions',
            sector: 'Fintech',
          }),
        ],
        total: 2,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.getPublicStartups(query);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResult,
      });
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(query);
      expect(logger.info).toHaveBeenCalledWith('Fetching public startups', { query });
    });

    it('should handle repository errors during retrieval', async () => {
      // Arrange
      const query = testgen.startupQuery();
      const error = new Error('Database connection failed');

      startupRepository.listPublicStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getPublicStartups(query)).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch public startups', {
        error,
        query,
      });
    });
  });

  describe('getStartupById', () => {
    it('should successfully retrieve an approved startup by ID', async () => {
      // Arrange
      const startupId = 'startup-123';
      const mockStartup = testgen.startup({
        id: startupId,
        name: 'TechCorp',
        status: StartupStatus.APPROVED,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getStartupById(startupId);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startup retrieved successfully',
        data: mockStartup,
      });
      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(logger.info).toHaveBeenCalledWith('Fetching startup by ID', { id: startupId });
    });

    it('should return error for non-existent startup', async () => {
      // Arrange
      const startupId = 'non-existent';

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.getStartupById(startupId);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not found',
      });
      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
    });

    it('should return error for non-approved startup', async () => {
      // Arrange
      const startupId = 'startup-123';
      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.PENDING,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getStartupById(startupId);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not available',
      });
    });

    it('should handle repository errors during retrieval', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getStartupById(startupId)).rejects.toThrow('Database connection failed');
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch startup by ID', {
        error,
        id: startupId,
      });
    });
  });

  describe('getStartupsWithMetrics', () => {
    it('should successfully retrieve startups with enhanced metrics', async () => {
      // Arrange
      const query = testgen.startupQuery();
      const mockStartups = [
        testgen.startup({
          id: 'startup-1',
          name: 'TechCorp',
          viewCount: 0,
          upvoteCount: 0,
        }),
        testgen.startup({
          id: 'startup-2',
          name: 'FinTech Inc',
          viewCount: 0,
          upvoteCount: 0,
        }),
      ];

      const mockResult = {
        startups: mockStartups,
        total: 2,
      };

      const mockAnalytics = {
        viewCount: 150,
        upvoteCount: 25,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);
      analyticsService.getStartupAnalytics.mockResolvedValue(mockAnalytics);

      // Act
      const result = await service.getStartupsWithMetrics(query);

      // Assert
      expect(result.status).toBe('successful');
      expect(result.message).toBe('Startups with metrics retrieved successfully');
      expect(result.data?.startups).toHaveLength(2);
      expect(result.data?.startups[0]).toMatchObject({
        id: 'startup-1',
        viewCount: 150,
        upvoteCount: 25,
      });
      expect(analyticsService.getStartupAnalytics).toHaveBeenCalledTimes(2);
    });

    it('should handle analytics service errors gracefully', async () => {
      // Arrange
      const query = testgen.startupQuery();
      const mockStartups = [
        testgen.startup({
          id: 'startup-1',
          viewCount: 100,
          upvoteCount: 10,
        }),
      ];

      const mockResult = {
        startups: mockStartups,
        total: 1,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);
      analyticsService.getStartupAnalytics.mockRejectedValue(new Error('Analytics service error'));

      // Act
      const result = await service.getStartupsWithMetrics(query);

      // Assert
      expect(result.status).toBe('successful');
      expect(result.data?.startups[0]).toMatchObject({
        id: 'startup-1',
        viewCount: 100, // Original values preserved
        upvoteCount: 10,
      });
      expect(logger.warn).toHaveBeenCalledWith('Failed to get analytics for startup', {
        error: expect.any(Error),
        startupId: 'startup-1',
      });
    });

    it('should handle repository errors during retrieval', async () => {
      // Arrange
      const query = testgen.startupQuery();
      const error = new Error('Database connection failed');

      startupRepository.listPublicStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getStartupsWithMetrics(query)).rejects.toThrow(
        'Database connection failed',
      );
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch startups with metrics', {
        error,
        query,
      });
    });
  });

  describe('searchStartups', () => {
    it('should search startups with query and filters', async () => {
      // Arrange
      const searchQuery = 'fintech AI';
      const filters = {
        sector: 'Fintech',
        stage: StartupStage.MVP,
      };

      const expectedQuery = {
        searchQuery,
        ...filters,
      };

      const mockResult = {
        startups: [testgen.startup()],
        total: 1,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.searchStartups(searchQuery, filters);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResult,
      });
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(expectedQuery);
      expect(logger.info).toHaveBeenCalledWith('Searching startups', { searchQuery, filters });
    });

    it('should search startups with query only', async () => {
      // Arrange
      const searchQuery = 'blockchain';
      const expectedQuery = { searchQuery };

      const mockResult = {
        startups: [],
        total: 0,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.searchStartups(searchQuery);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResult,
      });
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe('getTrendingStartups', () => {
    it('should return trending startups sorted by engagement score', async () => {
      // Arrange
      const limit = 5;
      const mockStartups = [
        testgen.startup({
          id: 'startup-1',
          viewCount: 100,
          upvoteCount: 10, // Score: 100 + (10 * 2) = 120
        }),
        testgen.startup({
          id: 'startup-2',
          viewCount: 200,
          upvoteCount: 5, // Score: 200 + (5 * 2) = 210
        }),
        testgen.startup({
          id: 'startup-3',
          viewCount: 50,
          upvoteCount: 20, // Score: 50 + (20 * 2) = 90
        }),
      ];

      const mockResult = {
        startups: mockStartups,
        total: 3,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.getTrendingStartups(limit);

      // Assert
      expect(result.status).toBe('successful');
      expect(result.message).toBe('Trending startups retrieved successfully');
      expect(result.data?.startups).toHaveLength(3);
      // Should be sorted by engagement score: startup-2 (210), startup-1 (120), startup-3 (90)
      expect(result.data?.startups[0].id).toBe('startup-2');
      expect(result.data?.startups[1].id).toBe('startup-1');
      expect(result.data?.startups[2].id).toBe('startup-3');
    });

    it('should limit results to specified count', async () => {
      // Arrange
      const limit = 2;
      const mockStartups = Array.from({ length: 5 }, (_, i) =>
        testgen.startup({
          id: `startup-${i + 1}`,
          viewCount: (i + 1) * 10,
          upvoteCount: i + 1,
        }),
      );

      const mockResult = {
        startups: mockStartups,
        total: 5,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.getTrendingStartups(limit);

      // Assert
      expect(result.data?.startups).toHaveLength(2);
    });

    it('should handle empty results', async () => {
      // Arrange
      const mockResult = {
        startups: [],
        total: 0,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.getTrendingStartups(10);

      // Assert
      expect(result.status).toBe('successful');
      expect(result.data?.startups).toHaveLength(0);
    });

    it('should handle repository errors during retrieval', async () => {
      // Arrange
      const limit = 10;
      const error = new Error('Database connection failed');

      startupRepository.listPublicStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getTrendingStartups(limit)).rejects.toThrow(
        'Database connection failed',
      );
      expect(logger.error).toHaveBeenCalledWith('Failed to fetch trending startups', {
        error,
        limit,
      });
    });
  });

  describe('getStartupsBySector', () => {
    it('should retrieve startups filtered by sector', async () => {
      // Arrange
      const sector = 'HealthTech';
      const limit = 15;

      const expectedQuery = {
        sector,
        limit,
        offset: 0,
      };

      const mockResult = {
        startups: [
          testgen.startup({ sector: 'HealthTech' }),
          testgen.startup({ sector: 'HealthTech' }),
        ],
        total: 2,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.getStartupsBySector(sector, limit);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResult,
      });
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(expectedQuery);
      expect(logger.info).toHaveBeenCalledWith('Fetching startups by sector', { sector, limit });
    });

    it('should use default limit when not specified', async () => {
      // Arrange
      const sector = 'EdTech';

      const expectedQuery = {
        sector,
        limit: 20, // Default limit
        offset: 0,
      };

      const mockResult = {
        startups: [],
        total: 0,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      await service.getStartupsBySector(sector);

      // Assert
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe('getStartupsByStage', () => {
    it('should retrieve startups filtered by stage', async () => {
      // Arrange
      const stage = 'mvp';
      const limit = 25;

      const expectedQuery = {
        stage: 'mvp' as StartupStage, // Type assertion happens in service
        limit,
        offset: 0,
      };

      const mockResult = {
        startups: [testgen.startup({ stage: StartupStage.MVP })],
        total: 1,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      const result = await service.getStartupsByStage(stage, limit);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResult,
      });
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(expectedQuery);
      expect(logger.info).toHaveBeenCalledWith('Fetching startups by stage', { stage, limit });
    });

    it('should use default limit when not specified', async () => {
      // Arrange
      const stage = 'mvp';

      const expectedQuery = {
        stage: 'mvp' as StartupStage,
        limit: 20, // Default limit
        offset: 0,
      };

      const mockResult = {
        startups: [],
        total: 0,
      };

      startupRepository.listPublicStartups.mockResolvedValue(mockResult);

      // Act
      await service.getStartupsByStage(stage);

      // Assert
      expect(startupRepository.listPublicStartups).toHaveBeenCalledWith(expectedQuery);
    });
  });

  describe('error handling', () => {
    it('should propagate repository errors in submitStartup', async () => {
      // Arrange
      const submission = testgen.startupSubmission();
      const error = new Error('Validation failed');

      startupRepository.createStartup.mockRejectedValue(error);

      // Act & Assert
      await expect(service.submitStartup(submission)).rejects.toThrow(error);
    });

    it('should propagate repository errors in getPublicStartups', async () => {
      // Arrange
      const query = testgen.startupQuery();
      const error = new Error('Connection timeout');

      startupRepository.listPublicStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getPublicStartups(query)).rejects.toThrow(error);
    });

    it('should propagate repository errors in getStartupById', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Database error');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getStartupById(startupId)).rejects.toThrow(error);
    });
  });
});
