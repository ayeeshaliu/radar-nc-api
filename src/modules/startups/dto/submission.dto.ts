import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { FounderGender, StartupStage } from './startup-enums';

// Main submission DTO
export class StartupSubmissionDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUrl()
  website: string;

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
  contactEmail: string;

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
