import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('user_contacts')
@Index('UQ_user_contacts_pair', ['userId', 'contactId'], { unique: true })
export class UserContactEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) userId: string;
  @Column({ type: 'uuid' }) contactId: string;
  @CreateDateColumn() createdAt: Date;
}
