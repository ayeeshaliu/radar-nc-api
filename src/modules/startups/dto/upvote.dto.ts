import { IsNotEmpty, IsString } from 'class-validator';

export class UpvoteDto {
  @IsNotEmpty()
  @IsString()
  userId: string;
}
