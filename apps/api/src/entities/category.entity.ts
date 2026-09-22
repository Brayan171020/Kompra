import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categories')
export class CategoryEntity {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) name: string;
  @Column() color: string;
  @Column() icon: string;
  @Index('IDX_categories_creator')
  @Column({ type: 'uuid', nullable: true }) creatorId: string | null;
}
