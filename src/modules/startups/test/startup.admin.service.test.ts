import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import type { MonoLogger } from '@withmono/logger';

import * as testgen from '../../../test/generator';
import { generateMockObject, getMockLogger } from '../../../test/util';
import { StartupStatus } from '../dto';
import StartupAdminService from '../startup.admin.service';
import StartupRepository from '../startup.repository';

describe(StartupAdminService.name, () => {
  let service: StartupAdminService;
  let startupRepository: jest.Mocked<StartupRepository>;
  let logger: MonoLogger;

  beforeEach(() => {
    startupRepository = generateMockObject('listAdminStartups', 'updateStartup', 'getStartupById');

    logger = getMockLogger();

    service = new StartupAdminService(startupRepository, logger);
  });

  describe('getAdminStartups', () => {
    it('should get admin startups successfully', async () => {
      // Arrange
      const query = testgen.adminStartupQuery({
        status: StartupStatus.PENDING,
        limit: 20,
        offset: 0,
      });

      const mockStartups = [
        testgen.adminStartup({
          name: 'TechCorp',
          status: StartupStatus.PENDING,
          adminNotes: 'Needs review',
        }),
        testgen.adminStartup({
          name: 'FinanceInc',
          status: StartupStatus.PENDING,
          adminNotes: 'Looks promising',
        }),
      ];

      const mockResponse = {
        startups: mockStartups,
        total: 2,
      };

      startupRepository.listAdminStartups.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAdminStartups(query);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResponse,
      });

      expect(startupRepository.listAdminStartups).toHaveBeenCalledWith(query);
    });

    it('should handle empty results', async () => {
      // Arrange
      const query = testgen.adminStartupQuery({
        status: StartupStatus.APPROVED,
      });

      const mockResponse = {
        startups: [],
        total: 0,
      };

      startupRepository.listAdminStartups.mockResolvedValue(mockResponse);

      // Act
      const result = await service.getAdminStartups(query);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: mockResponse,
      });

      expect(startupRepository.listAdminStartups).toHaveBeenCalledWith(query);
    });

    it('should handle repository errors', async () => {
      // Arrange
      const query = testgen.adminStartupQuery();
      const error = new Error('Database connection failed');

      startupRepository.listAdminStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAdminStartups(query)).rejects.toThrow('Database connection failed');

      expect(startupRepository.listAdminStartups).toHaveBeenCalledWith(query);
    });
  });

  describe('updateStartup', () => {
    it('should update startup successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const updateData = testgen.adminUpdateStartup({
        status: StartupStatus.APPROVED,
        adminNotes: 'Great startup, approved for public listing',
      });

      const mockUpdatedStartup = testgen.adminStartup({
        id: startupId,
        status: StartupStatus.APPROVED,
        adminNotes: 'Great startup, approved for public listing',
        updatedAt: new Date().toISOString(),
      });

      startupRepository.updateStartup.mockResolvedValue(mockUpdatedStartup);

      // Act
      const result = await service.updateStartup(startupId, updateData);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startup updated successfully',
        data: mockUpdatedStartup,
      });

      expect(startupRepository.updateStartup).toHaveBeenCalledWith(
        startupId,
        updateData.status,
        updateData.adminNotes,
      );
    });

    it('should return error when startup not found', async () => {
      // Arrange
      const startupId = 'non-existent';
      const updateData = testgen.adminUpdateStartup();

      startupRepository.updateStartup.mockResolvedValue(null);

      // Act
      const result = await service.updateStartup(startupId, updateData);

      // Assert
      expect(result).toEqual({
        status: 'error',
        message: 'Startup not found',
      });

      expect(startupRepository.updateStartup).toHaveBeenCalledWith(
        startupId,
        updateData.status,
        updateData.adminNotes,
      );
    });

    it('should handle repository errors during update', async () => {
      // Arrange
      const startupId = 'startup-123';
      const updateData = testgen.adminUpdateStartup();
      const error = new Error('Database update failed');

      startupRepository.updateStartup.mockRejectedValue(error);

      // Act & Assert
      await expect(service.updateStartup(startupId, updateData)).rejects.toThrow(
        'Database update failed',
      );

      expect(startupRepository.updateStartup).toHaveBeenCalledWith(
        startupId,
        updateData.status,
        updateData.adminNotes,
      );
    });

    it('should handle update with minimal data', async () => {
      // Arrange
      const startupId = 'startup-123';
      const updateData = testgen.adminUpdateStartup({
        status: StartupStatus.REJECTED,
      });

      const mockUpdatedStartup = testgen.adminStartup({
        id: startupId,
        status: StartupStatus.REJECTED,
        updatedAt: new Date().toISOString(),
      });

      startupRepository.updateStartup.mockResolvedValue(mockUpdatedStartup);

      // Act
      const result = await service.updateStartup(startupId, updateData);

      // Assert
      expect(result).toEqual({
        status: 'successful',
        message: 'Startup updated successfully',
        data: mockUpdatedStartup,
      });

      expect(startupRepository.updateStartup).toHaveBeenCalledWith(
        startupId,
        updateData.status,
        updateData.adminNotes,
      );
    });
  });

  describe('getAdminStartupById', () => {
    it('should get admin startup by ID successfully', async () => {
      // Arrange
      const startupId = 'startup-123';

      const mockStartup = testgen.adminStartup({
        id: startupId,
        name: 'TechCorp',
        status: StartupStatus.APPROVED,
        contactEmail: 'founder@techcorp.com',
        pitchDeck: 'https://example.com/pitch-deck',
        adminNotes: 'Great team and product',
      });

      startupRepository.getStartupById.mockResolvedValue(mockStartup);

      // Act
      const result = await service.getAdminStartupById(startupId);

      // Assert
      expect(result).toEqual(mockStartup);
      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should return null when startup not found', async () => {
      // Arrange
      const startupId = 'non-existent';

      startupRepository.getStartupById.mockResolvedValue(null);

      // Act
      const result = await service.getAdminStartupById(startupId);

      // Assert
      expect(result).toBeNull();
      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });

    it('should handle repository errors during retrieval', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Database connection failed');

      startupRepository.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(service.getAdminStartupById(startupId)).rejects.toThrow(
        'Database connection failed',
      );

      expect(startupRepository.getStartupById).toHaveBeenCalledWith(startupId, true);
    });
  });
});
