import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { QuantityType } from './list-item.entity.js';
import { ListTemplateEntity } from './list-template.entity.js';

@Entity('template_items')
@Index('IDX_template_items_template', ['templateId'])
export class TemplateItemEntity {
  @ApiProperty({ format: 'uuid' })
  @PrimaryGeneratedColumn('uuid') id: string;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' }) templateId: string;
  @ManyToOne(() => ListTemplateEntity, (template) => template.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'templateId' }) template: Relation<ListTemplateEntity>;
  @ApiProperty({ format: 'uuid' })
  @Column({ type: 'uuid' }) categoryId: string;
  @ApiProperty({ example: 'Tomates' })
  @Column({ type: 'varchar', length: 120 }) name: string;
  @ApiProperty({ enum: QuantityType, example: QuantityType.UNIT })
  @Column({ type: 'enum', enum: QuantityType, enumName: 'template_items_quantity_type_enum' }) quantityType: QuantityType;
  @ApiProperty({ minimum: 0.001, example: 1 })
  @Column({ type: 'decimal', precision: 12, scale: 3 }) targetQuantity: number;
  @ApiProperty({ nullable: true, example: null })
  @Column({ type: 'text', nullable: true }) note: string | null;
}
