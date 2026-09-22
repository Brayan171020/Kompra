import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum QuantityType { UNIT = 'UNIT', WEIGHT = 'WEIGHT' }
export enum ListItemStatus { PENDING = 'PENDING', PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED', COMPLETED = 'COMPLETED' }

@Entity('list_items')
export class ListItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() listId: string;
  @Column() categoryId: string;
  @Column() name: string;
  @Column({ type: 'enum', enum: QuantityType }) quantityType: QuantityType;
  @Column({ type: 'decimal', precision: 12, scale: 3 }) targetQuantity: number;
  @Column({ type: 'enum', enum: ListItemStatus, default: ListItemStatus.PENDING }) status: ListItemStatus;
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 }) purchasedQuantity: number;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @CreateDateColumn() createdAt: Date;
}
