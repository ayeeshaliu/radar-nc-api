import { Body, Get, Param, Put, QueryParams, UseBefore } from 'routing-controllers';
import { Inject } from 'typedi';

import { requireAuthType } from '../../middleware';

import {
  AdminStartupQueryDto,
  AdminStartupsResponse,
  AdminUpdateResponse,
  AdminUpdateStartupDto,
} from './dto';
import StartupAdminService from './startup.admin.service';

export class AdminStartupsController {
  constructor(@Inject() private adminService: StartupAdminService) {}

  /**
   * Get all startups for admin
   */
  @Get('/admin/startups')
  @UseBefore(requireAuthType('admin'))
  async getAdminStartups(
    @QueryParams() query: AdminStartupQueryDto,
  ): Promise<AdminStartupsResponse> {
    return this.adminService.getAdminStartups(query);
  }

  /**
   * Update startup status
   */
  @Put('/admin/startups/:id')
  @UseBefore(requireAuthType('admin'))
  async updateStartupStatus(
    @Param('id') id: string,
    @Body() updateData: AdminUpdateStartupDto,
  ): Promise<AdminUpdateResponse> {
    return this.adminService.updateStartup(id, updateData);
  }
}
