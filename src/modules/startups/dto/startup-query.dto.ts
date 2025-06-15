import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

import { FounderGender, StartupStage } from './types';

export class StartupQueryDto {
  @IsOptional()
  @IsString()
  sector?: string;

  @IsOptional()
  @IsEnum(StartupStage)
  stage?: StartupStage;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsEnum(FounderGender)
  founderGender?: FounderGender;

  @IsOptional()
  @IsBoolean()
  isStudentBuild?: boolean;

  @IsOptional()
  @IsString()
  tags?: string;

  @IsOptional()
  @IsString()
  searchQuery?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsInt()
  @Min(0)
  offset?: number = 0;
}
