import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

import { StartupStatus } from './types';

export class AdminStartupQueryDto {
  @IsOptional()
  @IsEnum(StartupStatus)
  status?: StartupStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
