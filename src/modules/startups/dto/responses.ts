import { JsonResponse } from '../../shared';

import { AdminStartupDto, StartupDto } from './types';

export type StartupSubmissionResponse = JsonResponse<{ id: string }>;
export type StartupResponse = JsonResponse<StartupDto>;
export type StartupsResponse = JsonResponse<{ startups: StartupDto[]; total: number }>;
export type AdminStartupsResponse = JsonResponse<{ startups: AdminStartupDto[]; total: number }>;
export type AdminUpdateResponse = JsonResponse<AdminStartupDto>;
export type TrackViewResponse = JsonResponse<{ success: boolean }>;
export type UpvoteResponse = JsonResponse<{ upvoted: boolean; upvoteCount: number }>;
export type ContactResponse = JsonResponse<{ success: boolean }>;
export type PitchDeckResponse = JsonResponse<{ url: string; expiresAt: string }>;
