import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { QuantityType } from '../../entities/list-item.entity.js';

export class TemplateItemInputDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ minLength: 1, maxLength: 120 })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ enum: QuantityType })
  @IsEnum(QuantityType)
  quantityType: QuantityType;

  @ApiProperty({ minimum: 0.001, example: 1 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  targetQuantity: number;

  @ApiPropertyOptional({ maxLength: 500 })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
