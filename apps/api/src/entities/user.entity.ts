import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm';

export enum UserRole { CREATOR = 'CREATOR', BUYER = 'BUYER' }

@Entity('users')
export class UserEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 }) id: string;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ type: 'enum', enum: UserRole, default: UserRole.BUYER }) role: UserRole;
  @CreateDateColumn() createdAt: Date;
}
