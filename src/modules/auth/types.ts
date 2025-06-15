import { JsonResponse } from '../shared';

export type JwtPayload = {
  sub: string; // Subject, user ID
  iat: number; // Issued at timestamp
  exp: number; // Expiration timestamp
  iss: string; // Issuer of the token
  aud: string; // Audience for which the token is intended
  roles: {
    founder: boolean; // Indicates if the user is a founder
    admin: boolean; // Indicates if the user is an admin
    investor: boolean; // Indicates if the user is an investor
    curious: boolean; // Indicates if the user is a curious person
  };
};

export type LoginResponse = JsonResponse<{
  userId: string;
  isFounder: boolean;
  isAdmin: boolean;
  isInvestor: boolean;
  isCuriousPerson: boolean;

  token: string;
  tokenExpiresAt: number;
}>;

export type AirtableUserFields = {
  Username: string;
  Password: string;

  Founder?: string;
  Investor?: string;
  Admin?: string;
};
