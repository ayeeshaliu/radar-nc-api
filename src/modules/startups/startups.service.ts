import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import {
  StartupDto,
  StartupQueryDto,
  StartupResponse,
  StartupsResponse,
  StartupStage,
  StartupSubmissionDto,
  StartupSubmissionResponse,
} from './dto';
import StartupAnalyticsService from './startup.analytics.service';
import StartupRepository from './startup.repository';

@Service()
export default class StartupsService {
  constructor(
    @Inject() private startupRepository: StartupRepository,
    @Inject() private analyticsService: StartupAnalyticsService,
    @Inject(diConstants.logger) private logger: MonoLogger,
  ) {}

  /**
   * Submit a new startup for review
   */
  async submitStartup(submission: StartupSubmissionDto): Promise<StartupSubmissionResponse> {
    this.logger.info('Submitting new startup', { name: submission.name });

    try {
      const startupId = await this.startupRepository.createStartup(submission);

      this.logger.info('Startup submitted successfully', {
        id: startupId,
        name: submission.name,
        founderEmail: submission.email,
      });

      return {
        status: 'successful',
        message: 'Startup submitted successfully and is pending review',
        data: { id: startupId },
      };
    } catch (error) {
      this.logger.error('Failed to submit startup', { error, submission });
      throw error;
    }
  }

  /**
   * Get approved startups for public directory
   */
  async getPublicStartups(query: StartupQueryDto): Promise<StartupsResponse> {
    this.logger.info('Fetching public startups', { query });

    try {
      const result = await this.startupRepository.listPublicStartups(query);

      return {
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to fetch public startups', { error, query });
      throw error;
    }
  }

  /**
   * Get a specific startup by ID
   */
  async getStartupById(id: string): Promise<StartupResponse> {
    this.logger.info('Fetching startup by ID', { id });

    try {
      const startup = await this.startupRepository.getStartupById(id);

      if (!startup) {
        return {
          status: 'error',
          message: 'Startup not found',
        };
      }

      if (startup.status !== 'approved') {
        return {
          status: 'error',
          message: 'Startup not available',
        };
      }

      return {
        status: 'successful',
        message: 'Startup retrieved successfully',
        data: startup,
      };
    } catch (error) {
      this.logger.error('Failed to fetch startup by ID', { error, id });
      throw error;
    }
  }

  /**
   * Get startups with enhanced data including engagement metrics
   */
  async getStartupsWithMetrics(query: StartupQueryDto): Promise<StartupsResponse> {
    this.logger.info('Fetching startups with metrics', { query });

    try {
      const result = await this.startupRepository.listPublicStartups(query);

      // Enhance startups with additional metrics if needed
      const enhancedStartups = await Promise.all(
        result.startups.map(async (startup) => {
          try {
            const analytics = await this.analyticsService.getStartupAnalytics(startup.id);
            return {
              ...startup,
              viewCount: analytics.viewCount,
              upvoteCount: analytics.upvoteCount,
            };
          } catch (error) {
            this.logger.warn('Failed to get analytics for startup', {
              error,
              startupId: startup.id,
            });
            return startup;
          }
        }),
      );

      return {
        status: 'successful',
        message: 'Startups with metrics retrieved successfully',
        data: {
          startups: enhancedStartups,
          total: result.total,
        },
      };
    } catch (error) {
      this.logger.error('Failed to fetch startups with metrics', { error, query });
      throw error;
    }
  }

  /**
   * Search startups by various criteria
   */
  async searchStartups(
    searchQuery: string,
    filters?: Partial<StartupQueryDto>,
  ): Promise<StartupsResponse> {
    this.logger.info('Searching startups', { searchQuery, filters });

    const query: StartupQueryDto = {
      searchQuery,
      ...filters,
    };

    return this.getPublicStartups(query);
  }

  /**
   * Get trending startups (most viewed or upvoted recently)
   */
  async getTrendingStartups(limit: number = 10): Promise<StartupsResponse> {
    this.logger.info('Fetching trending startups', { limit });

    try {
      // Get startups sorted by a combination of views and upvotes
      const query: StartupQueryDto = {
        limit,
        offset: 0,
      };

      const result = await this.getPublicStartups(query);

      if (result.status === 'successful' && result.data) {
        // Sort by engagement score (views + upvotes * 2)
        const sortedStartups = result.data.startups.sort((a: StartupDto, b: StartupDto) => {
          const scoreA = a.viewCount + a.upvoteCount * 2;
          const scoreB = b.viewCount + b.upvoteCount * 2;
          return scoreB - scoreA;
        });

        return {
          status: 'successful',
          message: 'Trending startups retrieved successfully',
          data: {
            startups: sortedStartups.slice(0, limit),
            total: sortedStartups.length,
          },
        };
      }

      return result;
    } catch (error) {
      this.logger.error('Failed to fetch trending startups', { error, limit });
      throw error;
    }
  }

  /**
   * Get startups by sector
   */
  async getStartupsBySector(sector: string, limit: number = 20): Promise<StartupsResponse> {
    this.logger.info('Fetching startups by sector', { sector, limit });

    const query: StartupQueryDto = {
      sector,
      limit,
      offset: 0,
    };

    return this.getPublicStartups(query);
  }

  /**
   * Get startups by stage
   */
  async getStartupsByStage(stage: string, limit: number = 20): Promise<StartupsResponse> {
    this.logger.info('Fetching startups by stage', { stage, limit });

    const query: StartupQueryDto = {
      stage: stage as StartupStage, // Type assertion for enum
      limit,
      offset: 0,
    };

    return this.getPublicStartups(query);
  }
}
