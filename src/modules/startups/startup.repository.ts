import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import { ConfigService } from '../configuration';
import {
  AirtableCreateRecordRequest,
  AirtableHttpClient,
  AirtableListOptions,
  AirtableRecord,
  AirtableUpdateRecordRequest,
} from '../http/airtable';

import {
  AdminStartupDto,
  AdminStartupQueryDto,
  AirtableStartupFields,
  FounderGender,
  StartupDto,
  StartupQueryDto,
  StartupStage,
  StartupStatus,
  StartupSubmissionDto,
} from './dto';

@Service()
export default class StartupRepository {
  private baseId: string;

  private tableName: string;

  constructor(
    @Inject() private airtableClient: AirtableHttpClient,
    @Inject() private configService: ConfigService,
    @Inject(diConstants.logger) private logger: MonoLogger,
  ) {
    this.baseId = this.configService.getRequired('airtableBaseId');
    this.tableName = this.configService.getRequired('airtableStartupsTableId');
  }

  /**
   * Create a new startup record in Airtable
   */
  async createStartup(submission: StartupSubmissionDto): Promise<string> {
    const airtableFields: AirtableStartupFields = this.mapSubmissionToAirtable(submission);

    const createRequest: AirtableCreateRecordRequest<AirtableStartupFields> = {
      fields: airtableFields,
    };

    const record = await this.airtableClient.createRecord<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      createRequest,
    );

    if (!record) {
      throw new Error('Failed to create startup record');
    }

    this.logger.info('Created startup record', { recordId: record.id, name: submission.name });
    return record.id;
  }

  /**
   * Get a startup by ID
   */
  getStartupById(id: string, includePrivateFields: true): Promise<AdminStartupDto | null>;

  getStartupById(id: string, includePrivateFields?: false): Promise<StartupDto | null>;

  async getStartupById(
    id: string,
    includePrivateFields = false,
  ): Promise<StartupDto | AdminStartupDto | null> {
    const record = await this.airtableClient.getRecord<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      id,
    );

    if (!record) {
      return null;
    }

    return includePrivateFields
      ? this.mapAirtableToAdminStartup(record)
      : this.mapAirtableToStartup(record);
  }

  /**
   * List startups for public directory (approved only)
   */
  async listPublicStartups(
    query: StartupQueryDto,
  ): Promise<{ startups: StartupDto[]; total: number }> {
    const filterFormula = this.buildPublicFilterFormula(query);
    const sortOptions = [{ field: 'Created At', direction: 'desc' as const }];

    const options: AirtableListOptions = {
      filterByFormula: filterFormula,
      sort: sortOptions,
      maxRecords: query.limit,
      offset: query.offset?.toString(),
    };

    const response = await this.airtableClient.listRecords<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      options,
    );

    if (!response) {
      return { startups: [], total: 0 };
    }

    const startups = response.records.map((record) => this.mapAirtableToStartup(record));
    return { startups, total: response.records.length };
  }

  /**
   * List startups for admin (all statuses)
   */
  async listAdminStartups(
    query: AdminStartupQueryDto,
  ): Promise<{ startups: AdminStartupDto[]; total: number }> {
    const filterFormula = this.buildAdminFilterFormula(query);
    const sortOptions = [{ field: 'Created At', direction: 'desc' as const }];

    const options: AirtableListOptions = {
      filterByFormula: filterFormula,
      sort: sortOptions,
      maxRecords: query.limit,
      offset: query.offset?.toString(),
    };

    const response = await this.airtableClient.listRecords<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      options,
    );

    if (!response) {
      return { startups: [], total: 0 };
    }

    const startups = response.records.map((record) => this.mapAirtableToAdminStartup(record));
    return { startups, total: response.records.length };
  }

  /**
   * Update startup status and admin fields
   */
  async updateStartup(
    id: string,
    status: StartupStatus,
    adminNotes?: string,
  ): Promise<AdminStartupDto | null> {
    const updateRequest: AirtableUpdateRecordRequest<AirtableStartupFields> = {
      fields: {
        Status: status,
        'Updated At': new Date().toISOString(),
        ...(adminNotes && { 'Admin Notes': adminNotes }),
      },
    };

    const record = await this.airtableClient.updateRecord<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      id,
      updateRequest,
    );

    if (!record) {
      return null;
    }

    this.logger.info('Updated startup record', { recordId: id, status, adminNotes });
    return this.mapAirtableToAdminStartup(record);
  }

  /**
   * Increment view count for a startup
   */
  async incrementViewCount(id: string): Promise<void> {
    const record = await this.airtableClient.getRecord<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      id,
    );

    if (!record) {
      throw new Error('Startup not found');
    }

    const currentViewCount = record.fields['View Count'] || 0;
    const updateRequest: AirtableUpdateRecordRequest<AirtableStartupFields> = {
      fields: {
        'View Count': currentViewCount + 1,
      },
    };

    await this.airtableClient.updateRecord<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      id,
      updateRequest,
    );
  }

  /**
   * Update upvote count for a startup
   */
  async updateUpvoteCount(id: string, newCount: number): Promise<void> {
    const updateRequest: AirtableUpdateRecordRequest<AirtableStartupFields> = {
      fields: {
        'Upvote Count': newCount,
      },
    };

    await this.airtableClient.updateRecord<AirtableStartupFields>(
      this.baseId,
      this.tableName,
      id,
      updateRequest,
    );
  }

  private mapSubmissionToAirtable(submission: StartupSubmissionDto): AirtableStartupFields {
    return {
      Name: submission.name,
      Description: submission.description,
      Website: submission.website,
      'Pitch Deck': submission.pitchDeck,
      Sector: submission.sector,
      Stage: submission.stage,
      Country: submission.country,
      'Founder Gender': submission.founderGender,
      'Student Build': submission.isStudentBuild,
      Tags: (submission.tags || []).map((x) => x.trim().toLowerCase()).join(', '),
      'Founder Name': submission.founderName,
      'Contact Email': submission.email,
      'Logo URL': submission.logoUrl,
      'LinkedIn URL': submission.linkedinUrl,
      'Twitter URL': submission.twitterUrl,
      Status: StartupStatus.PENDING,
      'View Count': 0,
      'Upvote Count': 0,
      'Created At': new Date().toISOString(),
      'Updated At': new Date().toISOString(),
    };
  }

  private mapAirtableToStartup(record: AirtableRecord<AirtableStartupFields>): StartupDto {
    const { fields } = record;
    return {
      id: record.id,
      name: fields.Name,
      description: fields.Description,
      website: fields.Website,
      sector: fields.Sector,
      stage: fields.Stage as StartupStage,
      country: fields.Country,
      founderGender: fields['Founder Gender'] as FounderGender,
      isStudentBuild: fields['Student Build'],
      tags: fields.Tags.split(',').map((x) => x.trim()) || [],
      founderName: fields['Founder Name'],
      logoUrl: fields['Logo URL'],
      linkedinUrl: fields['LinkedIn URL'],
      twitterUrl: fields['Twitter URL'],
      viewCount: fields['View Count'] || 0,
      upvoteCount: fields['Upvote Count'] || 0,
      createdAt: fields['Created At'],
      status: fields.Status as StartupStatus,
    };
  }

  private mapAirtableToAdminStartup(
    record: AirtableRecord<AirtableStartupFields>,
  ): AdminStartupDto {
    const startup = this.mapAirtableToStartup(record);
    const { fields } = record;

    return {
      ...startup,
      contactEmail: fields['Contact Email'],
      pitchDeck: fields['Pitch Deck'],
      adminNotes: fields['Admin Notes'],
      updatedAt: fields['Updated At'],
    };
  }

  private buildPublicFilterFormula(query: StartupQueryDto): string {
    const filters: string[] = [`{Status} = "${StartupStatus.APPROVED}"`];

    if (query.sector) {
      filters.push(`{Sector} = "${query.sector}"`);
    }

    if (query.stage) {
      filters.push(`{Stage} = "${query.stage}"`);
    }

    if (query.country) {
      filters.push(`{Country} = "${query.country}"`);
    }

    if (query.founderGender) {
      filters.push(`{Founder Gender} = "${query.founderGender}"`);
    }

    if (query.isStudentBuild !== undefined) {
      filters.push(`{Student Build} = ${query.isStudentBuild}`);
    }

    if (query.tags) {
      filters.push(`FIND("${query.tags}", ARRAYJOIN({Tags}, ",")) > 0`);
    }

    if (query.searchQuery) {
      const searchTerm = query.searchQuery.toLowerCase();
      filters.push(
        `OR(FIND("${searchTerm}", LOWER({Name})) > 0, FIND("${searchTerm}", LOWER({Description})) > 0)`,
      );
    }

    return `AND(${filters.join(', ')})`;
  }

  private buildAdminFilterFormula(query: AdminStartupQueryDto): string {
    const filters: string[] = [];

    if (query.status) {
      filters.push(`{Status} = "${query.status}"`);
    }

    return filters.length > 0 ? `AND(${filters.join(', ')})` : '';
  }
}
