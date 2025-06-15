import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import {
  AdminStartupDto,
  AdminStartupQueryDto,
  AdminStartupsResponse,
  AdminUpdateResponse,
  AdminUpdateStartupDto,
} from './dto';
import StartupRepository from './startup.repository';

@Service()
export default class StartupAdminService {
  constructor(
    @Inject() private startupRepository: StartupRepository,
    @Inject(diConstants.logger) private logger: MonoLogger,
  ) {}

  /**
   * Get all startups for admin panel with filtering by status
   */
  async getAdminStartups(query: AdminStartupQueryDto): Promise<AdminStartupsResponse> {
    this.logger.info('Fetching startups for admin', { query });

    try {
      const result = await this.startupRepository.listAdminStartups(query);

      return {
        status: 'successful',
        message: 'Startups retrieved successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Failed to fetch admin startups', { error, query });
      throw error;
    }
  }

  /**
   * Update startup status and admin notes
   */
  async updateStartup(id: string, updateData: AdminUpdateStartupDto): Promise<AdminUpdateResponse> {
    this.logger.info('Updating startup status', { id, updateData });

    try {
      const updatedStartup = await this.startupRepository.updateStartup(
        id,
        updateData.status,
        updateData.adminNotes,
      );

      if (!updatedStartup) {
        return {
          status: 'error',
          message: 'Startup not found',
        };
      }

      return {
        status: 'successful',
        message: 'Startup updated successfully',
        data: updatedStartup,
      };
    } catch (error) {
      this.logger.error('Failed to update startup', { error, id, updateData });
      throw error;
    }
  }

  /**
   * Get startup by ID with admin details
   */
  async getAdminStartupById(id: string): Promise<AdminStartupDto | null> {
    this.logger.info('Fetching startup for admin', { id });

    try {
      const startup = await this.startupRepository.getStartupById(id, true);
      return startup as AdminStartupDto | null;
    } catch (error) {
      this.logger.error('Failed to fetch admin startup by ID', { error, id });
      throw error;
    }
  }
}
