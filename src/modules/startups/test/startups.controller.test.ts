import 'reflect-metadata';

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import * as testgen from '../../../test/generator';
import { generateMockObject } from '../../../test/util';
import { StartupsController } from '../controllers';
import { StartupStatus } from '../dto';
import StartupAnalyticsService from '../startup.analytics.service';
import StartupEngagementService from '../startup.engagement.service';
import StartupPitchDeckService from '../startup.pitchdeck.service';
import StartupsService from '../startups.service';

describe(StartupsController.name, () => {
  let controller: StartupsController;
  let startupsService: jest.Mocked<StartupsService>;
  let analyticsService: jest.Mocked<StartupAnalyticsService>;
  let engagementService: jest.Mocked<StartupEngagementService>;
  let pitchDeckService: jest.Mocked<StartupPitchDeckService>;

  beforeEach(() => {
    startupsService = generateMockObject('getPublicStartups', 'submitStartup', 'getStartupById');

    analyticsService = generateMockObject('trackView', 'trackContactRequest');

    engagementService = generateMockObject('toggleUpvote');

    pitchDeckService = generateMockObject('getPitchDeckAccess');

    controller = new StartupsController(
      startupsService,
      analyticsService,
      engagementService,
      pitchDeckService,
    );
  });

  describe('getStartups', () => {
    it('should return public startups successfully', async () => {
      // Arrange
      const query = testgen.startupQuery({
        sector: 'Fintech',
        limit: 10,
        offset: 0,
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'Startups retrieved successfully',
        data: {
          startups: [
            testgen.startup({ name: 'TechCorp', sector: 'Fintech' }),
            testgen.startup({ name: 'FinanceInc', sector: 'Fintech' }),
          ],
          total: 2,
        },
      };

      startupsService.getPublicStartups.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getStartups(query);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(startupsService.getPublicStartups).toHaveBeenCalledWith(query);
    });

    it('should handle service errors', async () => {
      // Arrange
      const query = testgen.startupQuery();
      const error = new Error('Service error');

      startupsService.getPublicStartups.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getStartups(query)).rejects.toThrow('Service error');
    });
  });

  describe('submitStartup', () => {
    it('should submit startup successfully', async () => {
      // Arrange
      const submission = testgen.startupSubmission({
        name: 'TechCorp',
        description: 'AI-powered fintech solution',
        email: 'founder@techcorp.com',
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'Startup submitted successfully and is pending review',
        data: { id: 'startup-123' },
      };

      startupsService.submitStartup.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.submitStartup(submission);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(startupsService.submitStartup).toHaveBeenCalledWith(submission);
    });

    it('should handle service errors during submission', async () => {
      // Arrange
      const submission = testgen.startupSubmission();
      const error = new Error('Validation failed');

      startupsService.submitStartup.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.submitStartup(submission)).rejects.toThrow('Validation failed');
    });
  });

  describe('getStartupById', () => {
    it('should return startup by ID successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const expectedResponse = {
        status: 'successful' as const,
        message: 'Startup retrieved successfully',
        data: testgen.startup({
          id: startupId,
          name: 'TechCorp',
          status: StartupStatus.APPROVED,
        }),
      };

      startupsService.getStartupById.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getStartupById(startupId);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(startupsService.getStartupById).toHaveBeenCalledWith(startupId);
    });

    it('should handle startup not found', async () => {
      // Arrange
      const startupId = 'non-existent';
      const expectedResponse = {
        status: 'error' as const,
        message: 'Startup not found',
      };

      startupsService.getStartupById.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getStartupById(startupId);

      // Assert
      expect(result).toEqual(expectedResponse);
    });

    it('should handle service errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Database error');

      startupsService.getStartupById.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getStartupById(startupId)).rejects.toThrow('Database error');
    });
  });

  describe('trackView', () => {
    it('should track startup view successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const viewData = testgen.trackView({
        userAgent: 'Mozilla/5.0 test browser',
        ipAddress: '192.168.1.1',
        referrer: 'https://google.com',
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'View tracked successfully',
        data: { success: true },
      };

      analyticsService.trackView.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.trackView(startupId, viewData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(analyticsService.trackView).toHaveBeenCalledWith(startupId, viewData);
    });

    it('should handle view tracking errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const viewData = testgen.trackView();
      const error = new Error('Tracking failed');

      analyticsService.trackView.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.trackView(startupId, viewData)).rejects.toThrow('Tracking failed');
    });
  });

  describe('toggleUpvote', () => {
    it('should toggle upvote successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote({
        userId: 'user-456',
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'Upvote added successfully',
        data: {
          upvoted: true,
          upvoteCount: 6,
        },
      };

      engagementService.toggleUpvote.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.toggleUpvote(startupId, upvoteData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(engagementService.toggleUpvote).toHaveBeenCalledWith(startupId, upvoteData);
    });

    it('should handle upvote toggle errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const upvoteData = testgen.upvote();
      const error = new Error('Upvote failed');

      engagementService.toggleUpvote.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.toggleUpvote(startupId, upvoteData)).rejects.toThrow('Upvote failed');
    });
  });

  describe('trackContactRequest', () => {
    it('should track contact request successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const contactData = testgen.contactRequest({
        requesterName: 'John Investor',
        requesterEmail: 'john@investor.com',
        companyName: 'Investor Corp',
        message: 'Interested in partnering',
      });

      const expectedResponse = {
        status: 'successful' as const,
        message: 'Contact request recorded successfully',
        data: { success: true },
      };

      analyticsService.trackContactRequest.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.trackContactRequest(startupId, contactData);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(analyticsService.trackContactRequest).toHaveBeenCalledWith(startupId, contactData);
    });

    it('should handle contact tracking errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const contactData = testgen.contactRequest();
      const error = new Error('Contact tracking failed');

      analyticsService.trackContactRequest.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.trackContactRequest(startupId, contactData)).rejects.toThrow(
        'Contact tracking failed',
      );
    });
  });

  describe('getPitchDeckAccess', () => {
    it('should get pitch deck access successfully', async () => {
      // Arrange
      const startupId = 'startup-123';
      const expectedResponse = {
        status: 'successful' as const,
        message: 'Pitch deck access granted',
        data: {
          url: 'https://example.com/pitch-deck/startup-123',
          expiresAt: '2025-06-16T00:00:00.000Z',
        },
      };

      pitchDeckService.getPitchDeckAccess.mockResolvedValue(expectedResponse);

      // Act
      const result = await controller.getPitchDeckAccess(startupId);

      // Assert
      expect(result).toEqual(expectedResponse);
      expect(pitchDeckService.getPitchDeckAccess).toHaveBeenCalledWith(startupId);
    });

    it('should handle pitch deck access errors', async () => {
      // Arrange
      const startupId = 'startup-123';
      const error = new Error('Access denied');

      pitchDeckService.getPitchDeckAccess.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.getPitchDeckAccess(startupId)).rejects.toThrow('Access denied');
    });
  });

  describe('integration tests', () => {
    it('should handle complex workflow: submit -> get -> track view -> upvote', async () => {
      // This test simulates a real user workflow

      // 1. Submit startup
      const submission = testgen.startupSubmission({ name: 'WorkflowCorp' });
      const submitResponse = {
        status: 'successful' as const,
        message: 'Startup submitted successfully and is pending review',
        data: { id: 'startup-workflow' },
      };
      startupsService.submitStartup.mockResolvedValue(submitResponse);

      await controller.submitStartup(submission);

      // 2. Get startup (after approval)
      const getResponse = {
        status: 'successful' as const,
        message: 'Startup retrieved successfully',
        data: testgen.startup({ id: 'startup-workflow', name: 'WorkflowCorp' }),
      };
      startupsService.getStartupById.mockResolvedValue(getResponse);

      await controller.getStartupById('startup-workflow');

      // 3. Track view
      const trackResponse = {
        status: 'successful' as const,
        message: 'View tracked successfully',
        data: { success: true },
      };
      analyticsService.trackView.mockResolvedValue(trackResponse);

      await controller.trackView('startup-workflow', testgen.trackView());

      // 4. Upvote
      const upvoteResponse = {
        status: 'successful' as const,
        message: 'Upvote added successfully',
        data: { upvoted: true, upvoteCount: 1 },
      };
      engagementService.toggleUpvote.mockResolvedValue(upvoteResponse);

      await controller.toggleUpvote('startup-workflow', testgen.upvote());

      // Verify all services were called
      expect(startupsService.submitStartup).toHaveBeenCalled();
      expect(startupsService.getStartupById).toHaveBeenCalled();
      expect(analyticsService.trackView).toHaveBeenCalled();
      expect(engagementService.toggleUpvote).toHaveBeenCalled();
    });
  });
});
