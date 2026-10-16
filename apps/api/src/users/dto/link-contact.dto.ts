import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class LinkContactDto {
  @ApiProperty({ example: 'KMP-78E96065C2D847A18B9F632D' })
  @IsString()
  @Length(28, 28)
  @Matches(/^KMP-[A-F0-9]{24}$/)
  code: string;
}
