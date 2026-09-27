import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

export class AssignListDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assignedToId: string;

  @ApiPropertyOptional({ description: 'Copy acquired list items into the assignee inventory' })
  @IsOptional()
  @IsBoolean()
  copyToAssigneeInventory?: boolean;
}
