import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class AssignListDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  assignedToId: string;
}
