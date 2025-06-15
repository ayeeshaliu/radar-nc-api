import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { MonoLogger } from '@withmono/logger';

import * as testgen from '../../../test/generator';
import { generateMockObject, getMockLogger } from '../../../test/util';
import { StartupStatus } from '../dto';
import StartupPitchDeckService from '../startup.pitchdeck.service';
import StartupRepository from '../startup.repository';

describe(StartupPitchDeckService.name, () => {
  let service: StartupPitchDeckService;
  let startupRepository: jest.Mocked<StartupRepository>;
  let logger: MonoLogger;
  let mockAuthData: AuthenticatedAuthData;

  beforeEach(() => {
    startupRepository = generateMockObject('getStartupById');
    logger = getMockLogger();

    mockAuthData = {
      userId: 'user-456',
      isAuthenticated: true,
      isFounder: false,
      isAdmin: false,
      isInvestor: false,
      isCuriousPerson: false,
    };
    service = new StartupPitchDeckService(startupRepository, logger, mockAuthData);
  });

  describe('getPitchDeckAccess', () => {
    it('should grant pitch deck access for approved startup', async () => {
      // Arrange
      const startupId = 'startup-123';

      const mockStartup = testgen.adminStartup({
        id: startupId,
        name: 'TechCorp',
        status: StartupStatus.APPROVED,
        pitchDeck: 'https://drive.google.com/file/d/123/view',
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getPitchDeckAccess(startupId);

      // Assert
      expect(result.status).toBe('successful');
      expect(result.message).toBe('Pitch deck access granted');
      expect(result.data?.url).toContain('access_token');
      expect(result.data?.url).toContain(`user=${mockAuthData.userId}`); // Assert against mockAuthData.userId
      expect(result.data?.expiresAt).toBeDefined();

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should return error when startup is not found', async () => {
      // Arrange
      const startupId = 'non-existent';
      // const userId = 'user-456'; // userId is now sourced from mockAuthData

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.getPitchDeckAccess(startupId);

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
      // const userId = 'user-456'; // userId is now sourced from mockAuthData

      const mockStartup = testgen.adminStartup({
        id: startupId,
        status: StartupStatus.PENDING,
        pitchDeck: 'https://drive.google.com/file/d/123/view',
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getPitchDeckAccess(startupId);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup pitch deck not available',
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should return error when startup has no pitch deck', async () => {
      // Arrange
      const startupId = 'startup-123';
      // const userId = 'user-456'; // userId is now sourced from mockAuthData

      const mockStartup = testgen.adminStartup({
        id: startupId,
        status: StartupStatus.APPROVED,
        pitchDeck: '', // No pitch deck
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getPitchDeckAccess(startupId);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Pitch deck not available for this startup',
      });

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should handle repository errors during pitch deck access', async () => {
      // Arrange
      const startupId = 'startup-123';
      // const userId = 'user-456'; // userId is now sourced from mockAuthData
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      // Service method getPitchDeckAccess takes only startupId
      await expect(service.getPitchDeckAccess(startupId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should generate secure URLs with proper expiration', async () => {
      // Arrange
      const startupId = 'startup-123';
      // const userId = 'user-456'; // userId is now sourced from mockAuthData

      const mockStartup = testgen.adminStartup({
        id: startupId,
        name: 'TechCorp',
        status: StartupStatus.APPROVED,
        pitchDeck: 'https://drive.google.com/file/d/123/view',
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getPitchDeckAccess(startupId);

      // Assert
      expect(result.status).toBe('successful');
      expect(result.data?.url).toContain('access_token');
      expect(result.data?.url).toContain(mockAuthData.userId); // Assert against mockAuthData.userId

      // Check that expiration is set to future time (24 hours from now)
      const expirationTime = new Date(result.data!.expiresAt);
      const now = new Date();
      const timeDifference = expirationTime.getTime() - now.getTime();
      const hoursInMs = 24 * 60 * 60 * 1000;

      // Should be approximately 24 hours (within 1 minute tolerance)
      expect(timeDifference).toBeGreaterThan(hoursInMs - 60000);
      expect(timeDifference).toBeLessThan(hoursInMs + 60000);
    });
  });

  describe('canUserAccessPitchDecks', () => {
    it('should return true for any authenticated user', async () => {
      // Arrange
      const userId = 'user-456';

      // Act
      const result = await service.canUserAccessPitchDecks(userId);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle different user types', async () => {
      // Arrange
      const userIds = ['investor-123', 'partner-456', 'admin-789'];

      // Act & Assert
      await Promise.all(
        userIds.map(async (userId) => {
          const result = await service.canUserAccessPitchDecks(userId);
          expect(result).toBe(true);
        }),
      );
    });
  });

  describe('revokePitchDeckAccess', () => {
    it('should revoke pitch deck access successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const userId = 'user-456';

      // Act
      const result = await service.revokePitchDeckAccess(startupId, userId);

      // Assert
      expect(result).toBe(true);
    });

    it('should handle multiple revocations gracefully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const userIds = ['user-456', 'user-789', 'user-101'];

      // Act & Assert
      await Promise.all(
        userIds.map(async (userId) => {
          const result = await service.revokePitchDeckAccess(startupId, userId);
          expect(result).toBe(true);
        }),
      );
    });
  });
});
