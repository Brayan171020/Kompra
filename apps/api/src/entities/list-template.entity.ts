import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { TemplateItemEntity } from './template-item.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('list_templates')
@Index('IDX_list_templates_creator', ['creatorId'])
export class ListTemplateEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'varchar', length: 120 }) title: string;
  @Column({ type: 'varchar', length: 255 }) creatorId: string;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' }) creator: UserEntity;
  @OneToMany(() => TemplateItemEntity, (item) => item.template, { cascade: false }) items: Relation<TemplateItemEntity[]>;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
