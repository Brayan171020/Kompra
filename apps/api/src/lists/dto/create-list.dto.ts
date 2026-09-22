import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class CreateListDto {
  @ApiProperty({ example: 'Compra del fin de semana' })
  @IsString()
  @Length(2, 120)
  title: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'User id of the assigned BUYER or CREATOR' })
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
