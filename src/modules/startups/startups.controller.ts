import {
  Body,
  Get,
  JsonController,
  Param,
  Post,
  QueryParams,
  UseBefore,
} from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { requireAuthType } from '../../middleware'; // Updated import

import {
  ContactRequestDto,
  ContactResponse,
  PitchDeckResponse,
  StartupQueryDto,
  StartupResponse,
  StartupsResponse,
  StartupSubmissionDto,
  StartupSubmissionResponse,
  TrackViewDto,
  TrackViewResponse,
  UpvoteDto,
  UpvoteResponse,
} from './dto';
import StartupAnalyticsService from './startup.analytics.service';
import StartupEngagementService from './startup.engagement.service';
import StartupPitchDeckService from './startup.pitchdeck.service';
import StartupsService from './startups.service';

@Service()
@JsonController()
export default class StartupsController {
  constructor(
    @Inject() private startupsService: StartupsService,
    @Inject() private analyticsService: StartupAnalyticsService,
    @Inject() private engagementService: StartupEngagementService,
    @Inject() private pitchDeckService: StartupPitchDeckService,
  ) {}

  /**
   * Get approved startups for public directory
   */
  @Get('/startups')
  async getStartups(@QueryParams() query: StartupQueryDto): Promise<StartupsResponse> {
    return this.startupsService.getPublicStartups(query);
  }

  /**
   * Submit a new startup for review
   */
  @Post('/startups')
  async submitStartup(
    @Body() submission: StartupSubmissionDto,
  ): Promise<StartupSubmissionResponse> {
    return this.startupsService.submitStartup(submission);
  }

  /**
   * Get startup by ID
   */
  @Get('/startups/:id')
  async getStartupById(@Param('id') id: string): Promise<StartupResponse> {
    return this.startupsService.getStartupById(id);
  }

  /**
   * Track startup view
   */
  @Post('/startups/:id/view')
  async trackView(
    @Param('id') id: string,
    @Body() viewData: TrackViewDto,
  ): Promise<TrackViewResponse> {
    return this.analyticsService.trackView(id, viewData);
  }

  /**
   * Upvote or remove upvote from startup
   */
  @Post('/startups/:id/upvote')
  async toggleUpvote(
    @Param('id') id: string,
    @Body() upvoteData: UpvoteDto,
  ): Promise<UpvoteResponse> {
    return this.engagementService.toggleUpvote(id, upvoteData);
  }

  /**
   * Track contact request
   */
  @Post('/startups/:id/contact')
  async trackContactRequest(
    @Param('id') id: string,
    @Body() contactData: ContactRequestDto,
  ): Promise<ContactResponse> {
    return this.analyticsService.trackContactRequest(id, contactData);
  }

  /**
   * Get pitch deck access URL
   */
  @Get('/startups/:id/pitch-deck')
  @UseBefore(requireAuthType(['investor', 'founder']))
  async getPitchDeckAccess(@Param('id') id: string): Promise<PitchDeckResponse> {
    return this.pitchDeckService.getPitchDeckAccess(id);
  }
}
