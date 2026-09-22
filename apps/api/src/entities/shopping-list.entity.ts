import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

export enum ShoppingListStatus { ACTIVE = 'ACTIVE', FINISHED = 'FINISHED' }

@Entity('shopping_lists')
export class ShoppingListEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'enum', enum: ShoppingListStatus, default: ShoppingListStatus.ACTIVE }) status: ShoppingListStatus;
  @Column() creatorId: string;
  @Column({ nullable: true }) assignedToId: string | null;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) finishedAt: Date | null;
}
