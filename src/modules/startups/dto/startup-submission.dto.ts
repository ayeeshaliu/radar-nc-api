import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { FounderGender, FundingStatus, StartupStage } from './types';

export class StartupSubmissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsUrl()
  website: string;

  @IsNotEmpty()
  pitch: string;

  @IsNotEmpty()
  @IsUrl()
  pitchDeck: string;

  @IsNotEmpty()
  @IsString()
  sector: string;

  @IsNotEmpty()
  @IsEnum(StartupStage)
  stage: StartupStage;

  @IsNotEmpty()
  @IsString()
  country: string;

  @IsNotEmpty()
  @IsEnum(FounderGender)
  founderGender: FounderGender;

  @IsOptional()
  @IsEnum(FundingStatus)
  fundingStatus?: FundingStatus;

  @IsOptional()
  @IsUrl()
  appUrl?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  traction?: string;

  @IsNotEmpty()
  @IsBoolean()
  isStudentBuild: boolean;

  @IsOptional()
  @IsString({ each: true })
  tags?: string[];

  @IsNotEmpty()
  @IsString()
  founderName: string;

  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  logoUrl?: string;

  @IsOptional()
  @IsString()
  linkedinUrl?: string;

  @IsOptional()
  @IsString()
  twitterUrl?: string;
}
