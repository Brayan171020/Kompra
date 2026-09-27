import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { QuantityType } from './list-item.entity.js';
import { ListTemplateEntity } from './list-template.entity.js';

@Entity('template_items')
@Index('IDX_template_items_template', ['templateId'])
export class TemplateItemEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) templateId: string;
  @ManyToOne(() => ListTemplateEntity, (template) => template.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' }) template: Relation<ListTemplateEntity>;
  @Column({ type: 'uuid' }) categoryId: string;
  @Column({ type: 'varchar', length: 120 }) name: string;
  @Column({ type: 'enum', enum: QuantityType, enumName: 'template_items_quantity_type_enum' }) quantityType: QuantityType;
  @Column({ type: 'decimal', precision: 12, scale: 3 }) targetQuantity: number;
  @Column({ type: 'text', nullable: true }) note: string | null;
}
