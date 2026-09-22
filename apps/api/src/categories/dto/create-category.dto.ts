import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length, Matches } from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty({ example: 'Congelados' })
  @IsString()
  @Length(2, 60)
  name: string;

  @ApiPropertyOptional({ example: '#7C9A5B' })
  @IsOptional()
  @Matches(/^#[0-9A-Fa-f]{6}$/)
  color?: string;

  @ApiPropertyOptional({ example: 'snowflake' })
  @IsOptional()
  @IsString()
  @Length(1, 30)
  icon?: string;
}
