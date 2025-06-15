import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { MonoLogger } from '@withmono/logger';

import * as testgen from '../../../test/generator';
import { generateMockObject, getMockLogger } from '../../../test/util';
import { StartupStatus } from '../dto';
import StartupAnalyticsService from '../startup.analytics.service';
import StartupRepository from '../startup.repository';

describe(StartupAnalyticsService.name, () => {
  let service: StartupAnalyticsService;
  let startupRepository: jest.Mocked<StartupRepository>;
  let logger: MonoLogger;

  beforeEach(() => {
    startupRepository = generateMockObject('getStartupById', 'incrementViewCount');

    logger = getMockLogger();

    service = new StartupAnalyticsService(startupRepository, logger);
  });

  describe('trackView', () => {
    it('should track view successfully for approved startup', async () => {
      // Arrange
      const startupId = 'startup-123';
      const viewData = testgen.trackView({
        userAgent: 'Mozilla/5.0 test browser',
        ipAddress: '192.168.1.100',
        referrer: 'https://example.com',
      });

      const mockStartup = testgen.startup({
        id: startupId,
        name: 'TestCorp',
        status: StartupStatus.APPROVED,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.incrementViewCount.mockResolvedValue();

      // Act
      const result = await service.trackView(startupId, viewData);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'View tracked successfully',
        data: { success: true },
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(startupRepository.incrementViewCount).toHaveBeenCalledWith(startupId);
    });

    it('should return error when startup is not found', async () => {
      // Arrange
      const startupId = 'non-existent';
      const viewData = testgen.trackView();

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.trackView(startupId, viewData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not found',
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(startupRepository.incrementViewCount).not.toHaveBeenCalled();
    });

    it('should return error when startup is not approved', async () => {
      // Arrange
      const startupId = 'startup-123';
      const viewData = testgen.trackView();

      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.PENDING,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.trackView(startupId, viewData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not available for viewing',
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(startupRepository.incrementViewCount).not.toHaveBeenCalled();
    });

    it('should handle repository errors during view tracking', async () => {
      // Arrange
      const startupId = 'startup-123';
      const viewData = testgen.trackView();
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.trackView(startupId, viewData)).rejects.toThrow(
        'Database connection failed',
      );

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(startupRepository.incrementViewCount).not.toHaveBeenCalled();
    });

    it('should handle increment view count errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const viewData = testgen.trackView();

      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.APPROVED,
      });

      const error = new Error('Failed to increment view count');

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.incrementViewCount.mockRejectedValue(error);

      // Act & Assert
      await expect(service.trackView(startupId, viewData)).rejects.toThrow(
        'Failed to increment view count',
      );

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(startupRepository.incrementViewCount).toHaveBeenCalledWith(startupId);
    });
  });

  describe('trackContactRequest', () => {
    it('should track contact request successfully for approved startup', async () => {
      // Arrange
      const startupId = 'startup-123';
      const contactData = testgen.contactRequest({
        requesterName: 'John Investor',
        requesterEmail: 'john@investor.com',
        companyName: 'Investment Corp',
        message: 'Very interested in your startup',
      });

      const mockStartup = testgen.adminStartup({
        id: startupId,
        name: 'TestCorp',
        status: StartupStatus.APPROVED,
        contactEmail: 'founder@testcorp.com',
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.trackContactRequest(startupId, contactData);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Contact request recorded successfully',
        data: { success: true },
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should return error when startup is not found', async () => {
      // Arrange
      const startupId = 'non-existent';
      const contactData = testgen.contactRequest();

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.trackContactRequest(startupId, contactData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not found',
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should return error when startup is not approved', async () => {
      // Arrange
      const startupId = 'startup-123';
      const contactData = testgen.contactRequest();

      const mockStartup = testgen.adminStartup({
        id: startupId,
        status: StartupStatus.PENDING,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.trackContactRequest(startupId, contactData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not available for contact',
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should handle repository errors during contact tracking', async () => {
      // Arrange
      const startupId = 'startup-123';
      const contactData = testgen.contactRequest();
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.trackContactRequest(startupId, contactData)).rejects.toThrow(
        'Database connection failed',
      );

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });
  });

  describe('getStartupAnalytics', () => {
    it('should get startup analytics successfully', async () => {
      // Arrange
      const startupId = 'startup-123';

      const mockStartup = testgen.startup({
        id: startupId,
        viewCount: 150,
        upvoteCount: 25,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getStartupAnalytics(startupId);

      // Assert
      expect(result).toEqual({
        viewCount: 150,
        upvoteCount: 25,
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
    });

    it('should handle startup not found', async () => {
      // Arrange
      const startupId = 'non-existent';

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act & Assert
      await expect(service.getStartupAnalytics(startupId)).rejects.toThrow('Startup not found');

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
    });

    it('should handle repository errors during analytics retrieval', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getStartupAnalytics(startupId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
    });
  });
});
