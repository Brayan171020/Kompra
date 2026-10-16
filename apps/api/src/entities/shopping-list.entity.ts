import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ShoppingListStatus { ACTIVE = 'ACTIVE', FINISHED = 'FINISHED' }

@Entity('shopping_lists')
export class ShoppingListEntity {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ example: 'Compra del fin de semana' })
  @Column() title: string;
  @ApiProperty({ enum: ShoppingListStatus, example: ShoppingListStatus.ACTIVE })
  @Column({ type: 'enum', enum: ShoppingListStatus, default: ShoppingListStatus.ACTIVE }) status: ShoppingListStatus;
  @ApiProperty({ format: 'uuid' })
  @Column() creatorId: string;
  @ApiProperty({ format: 'uuid', nullable: true })
  @Column({ type: 'varchar', nullable: true }) assignedToId: string | null;
  @ApiProperty({ example: false })
  @Column({ default: false }) copyToAssigneeInventory: boolean;
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn() createdAt: Date;
  @ApiProperty({ format: 'date-time', nullable: true })
  @Column({ type: 'timestamptz', nullable: true }) finishedAt: Date | null;
}
