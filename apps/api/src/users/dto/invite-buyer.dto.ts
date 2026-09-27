import { IsEmail, MaxLength } from 'class-validator';

export class InviteBuyerDto {
  @IsEmail()
  @MaxLength(320)
  email: string;
}
