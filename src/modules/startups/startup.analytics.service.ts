import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import {
  AdminStartupDto,
  ContactRequestDto,
  ContactResponse,
  TrackViewDto,
  TrackViewResponse,
} from './dto';
import StartupRepository from './startup.repository';

@Service()
export default class StartupAnalyticsService {
  constructor(
    @Inject() private startupRepository: StartupRepository,
    @Inject(diConstants.logger) private logger: MonoLogger,
  ) {}

  /**
   * Track when a startup profile is viewed
   */
  async trackView(startupId: string, viewData: TrackViewDto): Promise<TrackViewResponse> {
    this.logger.info('Tracking startup view', { startupId, viewData });

    try {
      // Check if startup exists and is approved
      const startup = await this.startupRepository.getStartupById(startupId);
      if (!startup) {
        return {
          status: 'error',
          message: 'Startup not found',
        };
      }

      if (startup.status !== 'approved') {
        return {
          status: 'error',
          message: 'Startup not available for viewing',
        };
      }

      // Increment view count
      await this.startupRepository.incrementViewCount(startupId);

      // Log the view for analytics (could be expanded to store in separate analytics table)
      this.logger.info('Startup view tracked', {
        startupId,
        startupName: startup.name,
        userAgent: viewData.userAgent,
        ipAddress: viewData.ipAddress,
        referrer: viewData.referrer,
        timestamp: new Date().toISOString(),
      });

      return {
        status: 'successful',
        message: 'View tracked successfully',
        data: { success: true },
      };
    } catch (error) {
      this.logger.error('Failed to track startup view', { error, startupId, viewData });
      throw error;
    }
  }

  /**
   * Track when someone requests contact with a startup
   */
  async trackContactRequest(
    startupId: string,
    contactData: ContactRequestDto,
  ): Promise<ContactResponse> {
    this.logger.info('Tracking contact request', { startupId, contactData });

    try {
      // Check if startup exists and is approved
      const startup = await this.startupRepository.getStartupById(startupId, true);
      if (!startup) {
        return {
          status: 'error',
          message: 'Startup not found',
        };
      }

      if (startup.status !== 'approved') {
        return {
          status: 'error',
          message: 'Startup not available for contact',
        };
      }

      // Log the contact request for analytics and potential forwarding
      this.logger.info('Contact request tracked', {
        startupId,
        startupName: startup.name,
        // Safe cast since we got admin details
        startupContactEmail: (startup as AdminStartupDto).contactEmail,
        requesterName: contactData.requesterName,
        requesterEmail: contactData.requesterEmail,
        companyName: contactData.companyName,
        message: contactData.message,
        timestamp: new Date().toISOString(),
      });

      // In a real implementation, you might want to:
      // 1. Store contact requests in a separate table
      // 2. Send notification emails to the startup
      // 3. Queue the message for delivery

      return {
        status: 'successful',
        message: 'Contact request recorded successfully',
        data: { success: true },
      };
    } catch (error) {
      this.logger.error('Failed to track contact request', { error, startupId, contactData });
      throw error;
    }
  }

  /**
   * Get analytics data for a startup (could be expanded with more metrics)
   */
  async getStartupAnalytics(
    startupId: string,
  ): Promise<{ viewCount: number; upvoteCount: number }> {
    this.logger.info('Fetching startup analytics', { startupId });

    try {
      const startup = await this.startupRepository.getStartupById(startupId);
      if (!startup) {
        throw new Error('Startup not found');
      }

      return {
        viewCount: startup.viewCount,
        upvoteCount: startup.upvoteCount,
      };
    } catch (error) {
      this.logger.error('Failed to fetch startup analytics', { error, startupId });
      throw error;
    }
  }
}
