import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('inventory_purchases')
export class InventoryPurchaseEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() productName: string;
  @Column() categoryId: string;
  @Column({ type: 'decimal', precision: 12, scale: 3 }) quantity: number;
  @Column() unit: string;
  @Column({ type: 'date' }) purchaseDate: Date;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @CreateDateColumn() createdAt: Date;
}
