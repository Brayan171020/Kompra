import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('buyer_invitations')
@Index('IDX_buyer_invitations_email_pending', ['email', 'expiresAt'])
export class BuyerInvitationEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 255 }) creatorId: string;
  @Column({ type: 'varchar', length: 320 }) email: string;
  @Column({ type: 'timestamptz' }) expiresAt: Date;
  @Column({ type: 'timestamptz', nullable: true }) acceptedAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}
