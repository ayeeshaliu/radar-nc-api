import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import { UpvoteDto, UpvoteResponse } from './dto';
import StartupRepository from './startup.repository';

// In a real implementation, you might want to use Redis for upvote tracking
// For now, we'll use a simple in-memory store
interface UpvoteStore {
  [startupId: string]: Set<string>; // Set of user IDs who upvoted
}

@Service()
export default class StartupEngagementService {
  private upvoteStore: UpvoteStore = {};

  constructor(
    @Inject() private startupRepository: StartupRepository,
    @Inject(diConstants.logger) private logger: MonoLogger,
  ) {}

  /**
   * Toggle upvote for a startup by a user
   */
  async toggleUpvote(startupId: string, upvoteData: UpvoteDto): Promise<UpvoteResponse> {
    this.logger.info('Toggling upvote for startup', { startupId, userId: upvoteData.userId });

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
          message: 'Startup not available for upvoting',
        };
      }

      // Initialize upvote set for startup if it doesn't exist
      if (!this.upvoteStore[startupId]) {
        this.upvoteStore[startupId] = new Set();
      }

      const userUpvotes = this.upvoteStore[startupId];
      const hasUpvoted = userUpvotes.has(upvoteData.userId);
      let newUpvoteCount: number;

      if (hasUpvoted) {
        // Remove upvote
        userUpvotes.delete(upvoteData.userId);
        newUpvoteCount = Math.max(0, startup.upvoteCount - 1);
        this.logger.info('Removed upvote', { startupId, userId: upvoteData.userId });
      } else {
        // Add upvote
        userUpvotes.add(upvoteData.userId);
        newUpvoteCount = startup.upvoteCount + 1;
        this.logger.info('Added upvote', { startupId, userId: upvoteData.userId });
      }

      // Update upvote count in Airtable
      await this.startupRepository.updateUpvoteCount(startupId, newUpvoteCount);

      return {
        status: 'successful',
        message: hasUpvoted ? 'Upvote removed successfully' : 'Upvote added successfully',
        data: {
          upvoted: !hasUpvoted,
          upvoteCount: newUpvoteCount,
        },
      };
    } catch (error) {
      this.logger.error('Failed to toggle upvote', { error, startupId, upvoteData });
      throw error;
    }
  }

  /**
   * Check if a user has upvoted a startup
   */
  async hasUserUpvoted(startupId: string, userId: string): Promise<boolean> {
    if (!this.upvoteStore[startupId]) {
      return false;
    }
    return this.upvoteStore[startupId].has(userId);
  }

  /**
   * Get upvote count for a startup
   */
  async getUpvoteCount(startupId: string): Promise<number> {
    try {
      const startup = await this.startupRepository.getStartupById(startupId);
      return startup?.upvoteCount || 0;
    } catch (error) {
      this.logger.error('Failed to get upvote count', { error, startupId });
      return 0;
    }
  }

  /**
   * Initialize upvote store from existing data (for server restart recovery)
   * In a real implementation, this would load from Redis or database
   */
  async initializeUpvoteStore(): Promise<void> {
    this.logger.info('Initializing upvote store');
    // This would be implemented if we had a persistent store for upvotes
    // For now, we start with an empty store on each restart
  }
}
