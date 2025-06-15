import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ContactRequestDto {
  @IsNotEmpty()
  @IsString()
  requesterName: string;

  @IsNotEmpty()
  @IsEmail()
  requesterEmail: string;

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  companyName?: string;
}
