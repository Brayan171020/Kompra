import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export enum UserRole { CREATOR = 'CREATOR', BUYER = 'BUYER' }

@Entity('users')
export class UserEntity {
  @ApiProperty({ example: 'user-uuid' })
  @PrimaryColumn({ type: 'varchar', length: 255 }) id: string;
  @ApiProperty({ example: 'Brayan Gamboa' })
  @Column() name: string;
  @ApiProperty({ example: 'brayan@example.com', format: 'email' })
  @Column({ unique: true }) email: string;
  @ApiProperty({ enum: UserRole, example: UserRole.CREATOR })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.CREATOR }) role: UserRole;
  @ApiProperty({ example: 'KMP-78E96065C2D847A18B9F632D', nullable: true })
  @Index('UQ_users_share_code', { unique: true })
  @Column({ type: 'varchar', length: 28, nullable: true }) shareCode: string | null;
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn() createdAt: Date;
}
