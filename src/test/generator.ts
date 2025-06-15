import { ObjectId } from 'mongodb';

import { MonoModelsTypes } from '@withmono/models';
import { IDocument } from '@withmono/models/lib/mixins';

import {
  AdminStartupDto,
  AdminStartupQueryDto,
  AdminUpdateStartupDto,
  AirtableStartupFields,
  ContactRequestDto,
  FounderGender,
  StartupDto,
  StartupQueryDto,
  StartupStage,
  StartupStatus,
  StartupSubmissionDto,
  TrackViewDto,
  UpvoteDto,
} from '../modules';
import type { AirtableRecord } from '../modules/http/airtable';

export function app(overrides?: Partial<MonoModelsTypes.IApp>): MonoModelsTypes.IApp & IDocument {
  return {
    _id: new ObjectId(),
    live: true,
    name: 'Test',
    displayName: 'Test',
    testSecKey: 'test_xxx',
    liveSecKey: 'live_xxx',
    business: '',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as MonoModelsTypes.IApp & IDocument;
}

export function business(
  overrides?: Partial<MonoModelsTypes.IBusiness>,
): MonoModelsTypes.IBusiness & IDocument {
  return {
    _id: new ObjectId(),
    owner: 'ownerId',
    status: 'active',
    created_at: new Date(),
    updated_at: new Date(),
    ...overrides,
  } as MonoModelsTypes.IBusiness & IDocument;
}

export function startupSubmission(overrides?: Partial<StartupSubmissionDto>): StartupSubmissionDto {
  return {
    name: 'TechStartup Inc',
    description: 'Revolutionary AI-powered fintech solution',
    website: 'https://techstartup.com',
    pitchDeck: 'https://drive.google.com/file/d/123/view',
    sector: 'Fintech',
    stage: StartupStage.MVP,
    country: 'Nigeria',
    founderGender: FounderGender.MIXED,
    isStudentBuild: false,
    tags: ['AI', 'Fintech', 'B2B'],
    founderName: 'John Doe',
    contactEmail: 'john@techstartup.com',
    logoUrl: 'https://techstartup.com/logo.png',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    twitterUrl: 'https://twitter.com/johndoe',
    ...overrides,
  };
}

export function startupQuery(overrides?: Partial<StartupQueryDto>): StartupQueryDto {
  return {
    sector: 'Fintech',
    stage: StartupStage.MVP,
    country: 'Nigeria',
    founderGender: FounderGender.MIXED,
    isStudentBuild: false,
    tags: 'AI',
    searchQuery: 'fintech',
    limit: 20,
    offset: 0,
    ...overrides,
  };
}

export function adminStartupQuery(overrides?: Partial<AdminStartupQueryDto>): AdminStartupQueryDto {
  return {
    status: StartupStatus.PENDING,
    limit: 20,
    offset: 0,
    ...overrides,
  };
}

export function adminUpdateStartup(
  overrides?: Partial<AdminUpdateStartupDto>,
): AdminUpdateStartupDto {
  return {
    status: StartupStatus.APPROVED,
    adminNotes: 'Approved after review',
    ...overrides,
  };
}

export function trackView(overrides?: Partial<TrackViewDto>): TrackViewDto {
  return {
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    ipAddress: '192.168.1.1',
    referrer: 'https://google.com',
    ...overrides,
  };
}

export function upvote(overrides?: Partial<UpvoteDto>): UpvoteDto {
  return {
    userId: new ObjectId().toString(),
    ...overrides,
  };
}

export function contactRequest(overrides?: Partial<ContactRequestDto>): ContactRequestDto {
  return {
    requesterName: 'Jane Smith',
    requesterEmail: 'jane@investor.com',
    message: 'Interested in learning more about your startup',
    companyName: 'Investor Fund LLC',
    ...overrides,
  };
}

export function startup(overrides?: Partial<StartupDto>): StartupDto {
  return {
    id: new ObjectId().toString(),
    name: 'TechStartup Inc',
    description: 'Revolutionary AI-powered fintech solution',
    website: 'https://techstartup.com',
    sector: 'Fintech',
    stage: StartupStage.MVP,
    country: 'Nigeria',
    founderGender: FounderGender.MIXED,
    isStudentBuild: false,
    tags: ['AI', 'Fintech', 'B2B'],
    founderName: 'John Doe',
    logoUrl: 'https://techstartup.com/logo.png',
    linkedinUrl: 'https://linkedin.com/in/johndoe',
    twitterUrl: 'https://twitter.com/johndoe',
    viewCount: 150,
    upvoteCount: 25,
    createdAt: new Date().toISOString(),
    status: StartupStatus.APPROVED,
    ...overrides,
  };
}

export function adminStartup(overrides?: Partial<AdminStartupDto>): AdminStartupDto {
  const baseStartup = startup(overrides);
  return {
    ...baseStartup,
    contactEmail: 'john@techstartup.com',
    pitchDeck: 'https://drive.google.com/file/d/123/view',
    adminNotes: 'Looks promising',
    updatedAt: new Date().toISOString(),
    ...overrides,
  };
}

export function airtableStartupRecord(
  overrides?: Partial<AirtableRecord<Partial<AirtableStartupFields>>>,
): AirtableRecord<AirtableStartupFields> {
  return {
    id: 'rec123456789',
    createdTime: new Date().toISOString(),
    ...overrides,
    fields: airtableStartupFields(overrides?.fields),
  };
}

export function airtableStartupFields(
  overrides?: Partial<AirtableStartupFields>,
): AirtableStartupFields {
  return {
    Name: 'TechStartup Inc',
    Description: 'Revolutionary AI-powered fintech solution',
    Website: 'https://techstartup.com',
    'Pitch Deck': 'https://drive.google.com/file/d/123/view',
    Sector: 'Fintech',
    Stage: 'MVP',
    Country: 'Nigeria',
    'Founder Gender': 'mixed',
    'Student Build': false,
    Tags: ['AI', 'Fintech', 'B2B'],
    'Founder Name': 'John Doe',
    'Contact Email': 'john@techstartup.com',
    'Logo URL': 'https://techstartup.com/logo.png',
    'LinkedIn URL': 'https://linkedin.com/in/johndoe',
    'Twitter URL': 'https://twitter.com/johndoe',
    Status: 'approved',
    'View Count': 150,
    'Upvote Count': 25,
    'Admin Notes': 'Looks promising',
    'Created At': new Date().toISOString(),
    'Updated At': new Date().toISOString(),
    ...overrides,
  };
}
