import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID, IsString, Length } from 'class-validator';
import { QuantityType } from '../../entities/list-item.entity.js';

export class CreateProductDto {
  @ApiProperty({ example: 'Leche' })
  @IsString()
  @Length(1, 120)
  name: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ enum: QuantityType })
  @IsEnum(QuantityType)
  quantityType: QuantityType;
}
