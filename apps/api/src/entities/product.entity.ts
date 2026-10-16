import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { QuantityType } from './list-item.entity.js';

@Entity('products')
@Index('IDX_products_creator', ['creatorId'])
@Index('UQ_products_creator_category_name', ['creatorId', 'categoryId', 'name'], { unique: true })
export class ProductEntity {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'varchar', length: 255 }) creatorId: string;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' }) categoryId: string;
  @ApiProperty({ example: 'Leche' })
  @Column({ type: 'varchar', length: 120 }) name: string;
  @ApiProperty({ enum: QuantityType, example: QuantityType.UNIT })
  @Column({ type: 'enum', enum: QuantityType }) quantityType: QuantityType;
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn() createdAt: Date;
}
