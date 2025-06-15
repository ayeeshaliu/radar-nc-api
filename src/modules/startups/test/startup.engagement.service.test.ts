import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { MonoLogger } from '@withmono/logger';

import * as testgen from '../../../test/generator';
import { generateMockObject, getMockLogger } from '../../../test/util';
import { StartupStatus } from '../dto';
import StartupEngagementService from '../startup.engagement.service';
import StartupRepository from '../startup.repository';

describe(StartupEngagementService.name, () => {
  let service: StartupEngagementService;
  let startupRepository: jest.Mocked<StartupRepository>;
  let logger: MonoLogger;

  beforeEach(() => {
    logger = getMockLogger();

    startupRepository = generateMockObject('getStartupById', 'updateUpvoteCount');

    service = new StartupEngagementService(startupRepository, logger);
  });

  describe('toggleUpvote', () => {
    it('should successfully add upvote for approved startup', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote({
        userId: 'user-456',
      });

      const mockStartup = testgen.startup({
        id: startupId,
        name: 'TechCorp',
        status: StartupStatus.APPROVED,
        upvoteCount: 5,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.updateUpvoteCount.mockResolvedValue();

      // Act
      const result = await service.toggleUpvote(startupId, upvoteData);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Upvote added successfully',
        data: {
          upvoted: true,
          upvoteCount: 6,
        },
      });
      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
      expect(startupRepository.updateUpvoteCount).toHaveBeenCalledWith(startupId, 6);
      expect(logger.info).toHaveBeenCalledWith('Toggling upvote for startup', {
        startupId,
        userId: upvoteData.userId,
      });
      expect(logger.info).toHaveBeenCalledWith('Added upvote', {
        startupId,
        userId: upvoteData.userId,
      });
    });

    it('should successfully remove upvote when user has already upvoted', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote({
        userId: 'user-456',
      });

      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.APPROVED,
        upvoteCount: 5,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.updateUpvoteCount.mockResolvedValue();

      // First upvote to add user to the set
      await service.toggleUpvote(startupId, upvoteData);

      // Act - Second upvote to remove
      const result = await service.toggleUpvote(startupId, upvoteData);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Upvote removed successfully',
        data: {
          upvoted: false,
          upvoteCount: 4,
        },
      });
      expect(logger.info).toHaveBeenCalledWith('Removed upvote', {
        startupId,
        userId: upvoteData.userId,
      });
    });

    it('should return error for non-existent startup', async () => {
      // Arrange
      const startupId = 'non-existent';
      const upvoteData = testgen.upvote();

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.toggleUpvote(startupId, upvoteData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not found',
      });
      expect(startupRepository.updateUpvoteCount).not.toHaveBeenCalled();
    });

    it('should return error for non-approved startup', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote();
      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.PENDING,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.toggleUpvote(startupId, upvoteData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not available for upvoting',
      });
      expect(startupRepository.updateUpvoteCount).not.toHaveBeenCalled();
    });

    it('should handle minimum upvote count of 0', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote({
        userId: 'user-456',
      });

      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.APPROVED,
        upvoteCount: 0, // Already at 0
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.updateUpvoteCount.mockResolvedValue();

      // First add upvote
      await service.toggleUpvote(startupId, upvoteData);

      // Reset mock to test removal
      startupRepository.getStartupById.mockResolvedValue({
        ...mockStartup,
        upvoteCount: 1,
      });

      // Act - Remove upvote
      const result = await service.toggleUpvote(startupId, upvoteData);

      // Assert
      expect(result.data?.upvoteCount).toBe(0); // Should not go below 0
      expect(startupRepository.updateUpvoteCount).toHaveBeenLastCalledWith(startupId, 0);
    });

    it('should handle repository errors during upvote toggle', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote();
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.toggleUpvote(startupId, upvoteData)).rejects.toThrow(
        'Database connection failed',
      );
      expect(logger.error).toHaveBeenCalledWith('Failed to toggle upvote', {
        error,
        startupId,
        upvoteData,
      });
    });

    it('should handle errors during upvote count update', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote();
      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.APPROVED,
        upvoteCount: 5,
      });
      const error = new Error('Failed to update upvote count');

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.updateUpvoteCount.mockRejectedValue(error);

      // Act & Assert
      await expect(service.toggleUpvote(startupId, upvoteData)).rejects.toThrow(
        'Failed to update upvote count',
      );
      expect(logger.error).toHaveBeenCalledWith('Failed to toggle upvote', {
        error,
        startupId,
        upvoteData,
      });
    });
  });

  describe('hasUserUpvoted', () => {
    it('should return false for startup with no upvotes', async () => {
      // Arrange
      const startupId = 'startup-123';
      const userId = 'user-456';

      // Act
      const result = await service.hasUserUpvoted(startupId, userId);

      // Assert
      expect(result).toBe(false);
    });

    it('should return true for user who has upvoted', async () => {
      // Arrange
      const startupId = 'startup-123';
      const userId = 'user-456';
      const upvoteData = testgen.upvote({ userId });
      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.APPROVED,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.updateUpvoteCount.mockResolvedValue();

      // First upvote to add user to the set
      await service.toggleUpvote(startupId, upvoteData);

      // Act
      const result = await service.hasUserUpvoted(startupId, userId);

      // Assert
      expect(result).toBe(true);
    });

    it('should return false for user who has not upvoted', async () => {
      // Arrange
      const startupId = 'startup-123';
      const userId1 = 'user-456';
      const userId2 = 'user-789';
      const upvoteData = testgen.upvote({ userId: userId1 });
      const mockStartup = testgen.startup({
        id: startupId,
        status: StartupStatus.APPROVED,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);
      startupRepository.updateUpvoteCount.mockResolvedValue();

      // User1 upvotes
      await service.toggleUpvote(startupId, upvoteData);

      // Act - Check if user2 has upvoted
      const result = await service.hasUserUpvoted(startupId, userId2);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('getUpvoteCount', () => {
    it('should return upvote count for existing startup', async () => {
      // Arrange
      const startupId = 'startup-123';
      const mockStartup = testgen.startup({
        id: startupId,
        upvoteCount: 15,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getUpvoteCount(startupId);

      // Assert
      expect(result).toBe(15);
      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId);
    });

    it('should return 0 for non-existent startup', async () => {
      // Arrange
      const startupId = 'non-existent';

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.getUpvoteCount(startupId);

      // Assert
      expect(result).toBe(0);
    });

    it('should return 0 for startup with undefined upvote count', async () => {
      // Arrange
      const startupId = 'startup-123';
      const mockStartup = testgen.startup({
        id: startupId,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        upvoteCount: undefined as any,
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getUpvoteCount(startupId);

      // Assert
      expect(result).toBe(0);
    });

    it('should handle repository errors gracefully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act
      const result = await service.getUpvoteCount(startupId);

      // Assert
      expect(result).toBe(0);
      expect(logger.error).toHaveBeenCalledWith('Failed to get upvote count', {
        error,
        startupId,
      });
    });
  });

  describe('initializeUpvoteStore', () => {
    it('should initialize upvote store without errors', async () => {
      // Act
      await service.initializeUpvoteStore();

      // Assert
      expect(logger.info).toHaveBeenCalledWith('Initializing upvote store');
      // No errors should be thrown
    });
  });
});
