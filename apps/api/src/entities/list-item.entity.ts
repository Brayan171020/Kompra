import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum QuantityType { UNIT = 'UNIT', WEIGHT = 'WEIGHT' }
export enum ListItemStatus { PENDING = 'PENDING', PARTIALLY_COMPLETED = 'PARTIALLY_COMPLETED', COMPLETED = 'COMPLETED' }

@Entity('list_items')
export class ListItemEntity {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ format: 'uuid' })
  @Column() listId: string;
  @ApiProperty({ format: 'uuid' })
  @Column() categoryId: string;
  @ApiProperty({ example: 'Tomates' })
  @Column() name: string;
  @ApiProperty({ enum: QuantityType, example: QuantityType.UNIT })
  @Column({ type: 'enum', enum: QuantityType }) quantityType: QuantityType;
  @ApiProperty({ minimum: 0.001, example: 2 })
  @Column({ type: 'decimal', precision: 12, scale: 3 }) targetQuantity: number;
  @ApiProperty({ enum: ListItemStatus, example: ListItemStatus.PENDING })
  @Column({ type: 'enum', enum: ListItemStatus, default: ListItemStatus.PENDING }) status: ListItemStatus;
  @ApiProperty({ minimum: 0, example: 0 })
  @Column({ type: 'decimal', precision: 12, scale: 3, default: 0 }) purchasedQuantity: number;
  @ApiProperty({ nullable: true, example: null })
  @Column({ type: 'text', nullable: true }) note: string | null;
  @ApiProperty({ nullable: true, minimum: 0, example: null })
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true }) cost: number | null;
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn() createdAt: Date;
}
