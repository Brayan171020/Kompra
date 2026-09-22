import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { QuantityType } from '../../entities/list-item.entity.js';

export class CreateItemDto {
  @ApiProperty({ example: 'Tomates' })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ enum: QuantityType, example: QuantityType.UNIT })
  @IsEnum(QuantityType)
  quantityType: QuantityType;

  @ApiProperty({ example: 2, minimum: 0.001 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  targetQuantity: number;

  @ApiPropertyOptional({ example: 'Preferimos los maduros' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  note?: string;
}
