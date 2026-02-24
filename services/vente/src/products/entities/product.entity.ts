import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';

export enum ProductType {
  FILM = 'film',
  BD = 'bd',
  GOODIE = 'goodie',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ type: 'enum', enum: ProductType })
  type: ProductType;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'::jsonb" })
  metadata: Record<string, unknown>;

  @OneToMany('OrderItem', 'product')
  orderItems: unknown[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
