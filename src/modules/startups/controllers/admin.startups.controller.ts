import { Body, Get, JsonController, Param, Put, QueryParams, UseBefore } from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { requireAuthType } from '../../../middleware';
import {
  AdminStartupQueryDto,
  AdminStartupsResponse,
  AdminUpdateResponse,
  AdminUpdateStartupDto,
} from '../dto';
import StartupAdminService from '../startup.admin.service';

@Service()
@JsonController()
@UseBefore(requireAuthType('admin'))
export class AdminStartupsController {
  constructor(@Inject() private adminService: StartupAdminService) {}

  /**
   * Get all startups for admin
   */
  @Get('/admin/startups')
  async getAdminStartups(
    @QueryParams() query: AdminStartupQueryDto,
  ): Promise<AdminStartupsResponse> {
    return this.adminService.getAdminStartups(query);
  }

  /**
   * Update startup status
   */
  @Put('/admin/startups/:id')
  async updateStartupStatus(
    @Param('id') id: string,
    @Body() updateData: AdminUpdateStartupDto,
  ): Promise<AdminUpdateResponse> {
    return this.adminService.updateStartup(id, updateData);
  }
}
