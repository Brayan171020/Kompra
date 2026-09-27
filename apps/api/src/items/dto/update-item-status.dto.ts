import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Length, Min } from 'class-validator';
import { ListItemStatus } from '../../entities/list-item.entity.js';

export class UpdateItemStatusDto {
  @ApiPropertyOptional({ enum: ListItemStatus })
  @IsOptional()
  @IsEnum(ListItemStatus)
  status?: ListItemStatus;

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

  @ApiPropertyOptional({ example: 12.5, minimum: 0, description: 'Total cost paid for the acquired quantity' })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;
}
