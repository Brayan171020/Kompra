import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_purchases')
@Index('IDX_inventory_product_name', ['productName'])
@Index('IDX_inventory_purchase_date', ['purchaseDate'])
@Index('IDX_inventory_created_at', ['createdAt'])
@Index('IDX_inventory_category', ['categoryId'])
@Index('IDX_inventory_creator', ['creatorId'])
@Index('UQ_inventory_source_item_owner', ['sourceItemId', 'creatorId'], { unique: true, where: '"sourceItemId" IS NOT NULL' })
export class InventoryPurchaseEntity {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ example: 'Leche entera' })
  @Column() productName: string;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' }) categoryId: string;
  @ApiProperty({ example: 2, minimum: 0.001, maximum: 999999999.999 })
  @Column({ type: 'decimal', precision: 12, scale: 3 }) quantity: number;
  @ApiProperty({ example: 'und' })
  @Column() unit: string;
  @ApiProperty({ format: 'date-time' })
  @Column({ type: 'timestamptz' }) purchaseDate: Date;
  @ApiProperty({ nullable: true, example: null })
  @Column({ type: 'text', nullable: true }) description: string | null;
  @ApiProperty({ nullable: true, minimum: 0, example: 12.5 })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true }) cost: number | null;
  @ApiProperty({ format: 'uuid', nullable: true })
  @Column({ type: 'uuid', nullable: true }) sourceListId: string | null;
  @ApiProperty({ format: 'uuid', nullable: true })
  @Column({ type: 'uuid', nullable: true }) sourceItemId: string | null;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' }) creatorId: string;
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn() createdAt: Date;
}
