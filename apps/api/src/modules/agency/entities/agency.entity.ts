import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { AgencyMembership } from './agency-membership.entity';

@Entity('agencies')
export class Agency {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  district: string;

  @Column({ nullable: true })
  country: string;

  @Column({ type: 'jsonb', nullable: true })
  coverage: Record<string, any>; // e.g. geo coverage

  @OneToMany(() => AgencyMembership, (m) => m.agency)
  memberships: AgencyMembership[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}