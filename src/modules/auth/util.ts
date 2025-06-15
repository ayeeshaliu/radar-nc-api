import { createHmac } from 'crypto';

import bcrypt from 'bcrypt';
import dayjs from 'dayjs';

import { getConfigService } from '../configuration';

import { JwtPayload } from './types';

export async function hashPassword(plainTextPassword: string): Promise<string> {
  const saltRounds = 12;
  return bcrypt.hash(plainTextPassword, saltRounds);
}

export function comparePasswords(
  plainTextPassword: string,
  hashedPassword: string,
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, hashedPassword);
}

export function generateJwtSecret(payload: JwtPayload): string {
  const globalSecret = getConfigService().getRequired('jwtSecret');
  return createHmac('sha256', globalSecret).update(`${payload.sub}${payload.iat}`).digest('base64');
}

export function getJwtPayload(authData: AuthenticatedAuthData): JwtPayload {
  const iat = dayjs().unix();
  const exp = dayjs().add(7, 'days').unix();

  const configService = getConfigService();

  return {
    sub: authData.userId,
    roles: {
      founder: authData.isFounder,
      admin: authData.isAdmin,
      investor: authData.isInvestor,
      curious: authData.isCuriousPerson,
    },
    iat,
    exp,
    iss: configService.getRequired('jwtIssuer'),
    aud: configService.getRequired('jwtAudience'),
  };
}

export function generateJwtToken(payload: JwtPayload): string {
  const header = JSON.stringify({ alg: 'HS256', typ: 'JWT' });
  const encodedHeader = Buffer.from(header).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const secret = generateJwtSecret(payload);

  const signature = createHmac('sha256', secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function validateJwtPayload(payload: JwtPayload): boolean {
  const currentTime = dayjs().unix();
  if (payload.iat > currentTime || payload.exp < currentTime) {
    return false; // Token is not valid
  }

  const configService = getConfigService();
  if (payload.iss !== configService.getRequired('jwtIssuer')) {
    return false; // Invalid issuer
  }

  return payload.aud === configService.getRequired('jwtAudience');
}

export function validateJwtSignature(jwt: string): boolean {
  const [header, payload, signature] = jwt.split('.');
  const secret = generateJwtSecret(JSON.parse(payload));

  const expectedSignature = createHmac('sha256', secret)
    .update(`${header}.${payload}`)
    .digest('base64');
  return signature === expectedSignature;
}
