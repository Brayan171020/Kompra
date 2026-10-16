import { ApiProperty } from '@nestjs/swagger';
import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { TemplateItemEntity } from './template-item.entity.js';
import { UserEntity } from './user.entity.js';

@Entity('list_templates')
@Index('IDX_list_templates_creator', ['creatorId'])
export class ListTemplateEntity {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ example: 'Compra semanal' })
  @Column({ type: 'varchar', length: 120 }) title: string;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'varchar', length: 255 }) creatorId: string;
  @ManyToOne(() => UserEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'creatorId' }) creator: UserEntity;
  @ApiProperty({ type: () => [TemplateItemEntity] })
  @OneToMany(() => TemplateItemEntity, (item) => item.template, { cascade: false }) items: Relation<TemplateItemEntity[]>;
  @ApiProperty({ format: 'date-time' })
  @CreateDateColumn() createdAt: Date;
  @ApiProperty({ format: 'date-time' })
  @UpdateDateColumn() updatedAt: Date;
}
