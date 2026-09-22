import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_purchases')
@Index('IDX_inventory_product_name', ['productName'])
@Index('IDX_inventory_purchase_date', ['purchaseDate'])
@Index('IDX_inventory_created_at', ['createdAt'])
@Index('IDX_inventory_category', ['categoryId'])
@Index('IDX_inventory_creator', ['creatorId'])
@Index('UQ_inventory_source_item', ['sourceItemId'], { unique: true })
export class InventoryPurchaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() productName: string;
  @Column({ type: 'uuid' }) categoryId: string;
  @Column({ type: 'decimal', precision: 12, scale: 3 }) quantity: number;
  @Column() unit: string;
  @Column({ type: 'timestamptz' }) purchaseDate: Date;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true }) cost: number | null;
  @Column({ type: 'uuid', nullable: true }) sourceListId: string | null;
  @Column({ type: 'uuid', nullable: true }) sourceItemId: string | null;
  @Column({ type: 'uuid' }) creatorId: string;
  @CreateDateColumn() createdAt: Date;
}
