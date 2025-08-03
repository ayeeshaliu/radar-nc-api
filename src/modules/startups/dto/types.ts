// Startup enums and basic DTOs
export enum StartupStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum StartupStage {
  IDEA = 'idea',
  PROTOTYPE = 'prototype',
  MVP = 'mvp',
  GROWTH = 'growth',
  SCALE = 'scale',
}

export enum FounderGender {
  MALE = 'male',
  FEMALE = 'female',
  NON_BINARY = 'non-binary',
  MIXED = 'mixed',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}

export enum FundingStatus {
  NO_FUNDING = 'No Funding',
  GRANTS = 'Grants',
  ANGEL_INVESTMENT = 'Angel Investment',
  VENTURE_CAPITAL = 'Venture Capital',
  OTHERS = 'Others',
}

// Base interfaces
export interface StartupDto {
  id: string;
  name: string;
  description: string;
  website: string;
  sector: string;
  stage: StartupStage;
  country: string;
  founderGender: FounderGender;
  isStudentBuild: boolean;
  tags: string[];
  fundingStatus?: FundingStatus;
  traction?: string;
  founderName?: string;
  logoUrl?: string;
  appUrl?: string;
  linkedinUrl?: string;
  twitterUrl?: string;
  viewCount: number;
  upvoteCount: number;
  createdAt: string;
  status: StartupStatus;
}

export interface AdminStartupDto extends StartupDto {
  contactEmail?: string;
  pitchDeck: string;
  adminNotes?: string;
  updatedAt: string;
}

// Airtable field mapping for the startup table
export interface AirtableStartupFields {
  Name: string;
  Description: string;
  Website: string;
  Pitch: string;
  'Pitch Deck': string;
  Sector: string;
  Stage: string;
  Country: string;
  'Founder Gender': string;
  'Student Build': boolean;
  Tags?: string;
  'Founder Name'?: string;
  'Contact Email'?: string;
  'Logo URL'?: string;
  'App URL'?: string;
  Traction?: string;
  'Funding Status'?: string;
  'LinkedIn URL'?: string;
  'Twitter URL'?: string;
  Status: string;
  'View Count': number;
  'Upvote Count': number;
  'Admin Notes'?: string;
  'Created At': string;
  'Updated At': string;
}
