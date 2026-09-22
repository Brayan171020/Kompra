import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';

export enum InventoryUnit { KG = 'kg', G = 'g', UNIT = 'und', PACKAGE = 'paquete', LITER = 'litro' }

export class CreateInventoryPurchaseDto {
  @ApiProperty({ example: 'Leche entera' })
  @IsString()
  @Length(1, 120)
  productName: string;

  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  categoryId: string;

  @ApiProperty({ example: 2, minimum: 0.001 })
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity: number;

  @ApiProperty({ enum: InventoryUnit, example: InventoryUnit.UNIT })
  @IsEnum(InventoryUnit)
  unit: InventoryUnit;

  @ApiProperty({ format: 'date-time' })
  @IsDateString()
  purchaseDate: string;

  @ApiPropertyOptional({ example: 'Marca preferida' })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  @ApiPropertyOptional({ example: 12.5, minimum: 0 })
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cost?: number;
}
