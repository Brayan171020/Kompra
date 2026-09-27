import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsOptional, IsString, Length, ValidateNested } from 'class-validator';
import { TemplateItemInputDto } from './template-item-input.dto.js';

export class CreateTemplateDto {
  @ApiProperty({ minLength: 2, maxLength: 120 })
  @IsString()
  @Length(2, 120)
  title: string;

  @ApiPropertyOptional({ type: [TemplateItemInputDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => TemplateItemInputDto)
  items?: TemplateItemInputDto[];
}
