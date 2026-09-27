import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';
import { QuantityType } from './list-item.entity.js';

@Entity('products')
@Index('IDX_products_creator', ['creatorId'])
@Index('UQ_products_creator_category_name', ['creatorId', 'categoryId', 'name'], { unique: true })
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 255 }) creatorId: string;
  @Column({ type: 'uuid' }) categoryId: string;
  @Column({ type: 'varchar', length: 120 }) name: string;
  @Column({ type: 'enum', enum: QuantityType }) quantityType: QuantityType;
  @CreateDateColumn() createdAt: Date;
}
