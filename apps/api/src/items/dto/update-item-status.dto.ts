import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { ListItemStatus } from '../../entities/list-item.entity.js';

export class UpdateItemStatusDto {
  @ApiProperty({ enum: ListItemStatus })
  @IsEnum(ListItemStatus)
  status: ListItemStatus;

  @ApiPropertyOptional({ example: 0.5, minimum: 0.001 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  purchasedQuantity?: number;

  @ApiPropertyOptional({ example: 'Solo había de 500g' })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  note?: string;
}
