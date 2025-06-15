import { UnauthorizedError } from 'routing-controllers';
import { Inject, Service } from 'typedi';

import { diConstants } from '@withmono/di';
import { MonoLogger } from '@withmono/logger';

import { ConfigService } from '../configuration';
import { AirtableHttpClient } from '../http/airtable';

import { AirtableUserFields } from './types';
import { comparePasswords } from './util';

@Service()
export class PasswordAuthService {
  private readonly airtableBaseId: string;

  private readonly airtableUserTable: string;

  constructor(
    @Inject(diConstants.logger) private readonly logger: MonoLogger,
    @Inject() private readonly configService: ConfigService,
    @Inject() private readonly airtableClient: AirtableHttpClient,
  ) {
    this.airtableBaseId = this.configService.getRequired('airtableBaseId');
    this.airtableUserTable = this.configService.getRequired('airtableUsersTableId');

    this.logger.debug('AuthService initialized', {
      airtableBaseId: this.airtableBaseId,
      airtableUserTable: this.airtableUserTable,
    });
  }

  async authenticate(username: string, password: string): Promise<AuthenticatedAuthData> {
    this.logger.debug('Attempting to log in user via username and password', { username });

    const result = await this.airtableClient.listRecords<AirtableUserFields>(
      this.airtableBaseId,
      this.airtableUserTable,
      {
        maxRecords: 1,
        filterByFormula: `{Username} = '${username}'`,
      },
    );

    if (!result || result.records.length === 0) {
      this.logger.warn('Login failed: User not found', { username });
      throw new UnauthorizedError('Invalid username or password');
    }

    const user = result.records[0];
    const isPasswordValid = await comparePasswords(password, user.fields.Password);
    if (!isPasswordValid) {
      this.logger.warn('Login failed: Invalid password', { username });
      throw new UnauthorizedError('Invalid username or password');
    }

    this.logger.info('User logged in successfully', { username });
    return {
      isAuthenticated: true,
      userId: user.id,
      isAdmin: !!user.fields.Admin,
      isInvestor: !!user.fields.Investor,
      isCuriousPerson: true,
      isFounder: !!user.fields.Founder,
    };
  }
}
