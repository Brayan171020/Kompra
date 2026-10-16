import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @ApiProperty({ format: 'uuid', example: 'bcd87f95-6ae6-4ca1-8dd7-653dd0d3468e' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ example: 'Alimentos' })
  @Column({ unique: true }) name: string;
  @ApiProperty({ example: '#7C9A5B' })
  @Column() color: string;
  @ApiProperty({ example: 'tag' })
  @Column() icon: string;
  @ApiProperty({ format: 'uuid', nullable: true, example: null })
  @Index('IDX_categories_creator')
  @Column({ type: 'uuid', nullable: true }) creatorId: string | null;
}
