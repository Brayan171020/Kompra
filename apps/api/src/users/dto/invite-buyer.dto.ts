import { IsEmail, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InviteBuyerDto {
  @ApiProperty({ example: 'buyer@example.com', format: 'email', maxLength: 320, description: 'Correo de la persona que recibirá la invitación.' })
  @IsEmail()
  @MaxLength(320)
  email: string;
}
