import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

import { StartupStatus } from './types';

export class AdminUpdateStartupDto {
  @IsNotEmpty()
  @IsEnum(StartupStatus)
  status: StartupStatus;

  @IsOptional()
  @IsString()
  adminNotes?: string;
}
