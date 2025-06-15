import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import * as testgen from '../../../test/generator';
import { generateMockObject } from '../../../test/util';
import { AdminStartupsController } from '../controllers';
import { StartupStatus } from '../dto';
import StartupAdminService from '../startup.admin.service';

describe(AdminStartupsController.name, () => {
  let controller: AdminStartupsController;
  let adminService: jest.Mocked<StartupAdminService>;

  beforeEach(() => {
    adminService = generateMockObject('getAdminStartups', 'updateStartup');

    controller = new AdminStartupsController(adminService);
  });

  describe('getAdminStartups', () => {
    it('should return admin startups successfully', async () => {
      // Arrange
      const query = testgen.adminStartupQuery({
        status: StartupStatus.PENDING,
        limit: 20,
        offset: 0,
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'Admin startups retrieved successfully',
        data: {
          startups: [
            testgen.adminStartup({ status: StartupStatus.PENDING }),
            testgen.adminStartup({ status: StartupStatus.PENDING }),
          ],
          total: 2,
        },
      };

      adminService.getAdminStartups.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getAdminStartups(query);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(adminService.getAdminStartups).toHaveBeenCalledWith(query);
    });

    it('should handle admin service errors', async () => {
      // Arrange
      const query = testgen.adminStartupQuery();
      const error = new Error('Admin service error');

      adminService.getAdminStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getAdminStartups(query)).rejects.toThrow('Admin service error');
    });
  });

  describe('updateStartupStatus', () => {
    it('should update startup status successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const updateData = testgen.adminUpdateStartup({
        status: StartupStatus.APPROVED,
        adminNotes: 'Great startup, approved for public listing',
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'Startup updated successfully',
        data: testgen.adminStartup({
          id: startupId,
          status: StartupStatus.APPROVED,
          adminNotes: 'Great startup, approved for public listing',
        }),
      };

      adminService.updateStartup.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.updateStartupStatus(startupId, updateData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(adminService.updateStartup).toHaveBeenCalledWith(startupId, updateData);
    });

    it('should handle update errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const updateData = testgen.adminUpdateStartup();
      const error = new Error('Update failed');

      adminService.updateStartup.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.updateStartupStatus(startupId, updateData)).rejects.toThrow(
        'Update failed',
      );
    });
  });
});
