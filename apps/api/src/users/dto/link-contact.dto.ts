import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class LinkContactDto {
  @ApiProperty({ example: 'KMP-78E96' })
  @IsString()
  @Length(9, 9)
  @Matches(/^KMP-[A-Z0-9]{5}$/)
  code: string;
}
