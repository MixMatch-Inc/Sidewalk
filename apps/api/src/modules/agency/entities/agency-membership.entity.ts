import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Agency } from './agency.entity';
import { AgencyRole } from '../enums/agency-role.enum';

@Entity('agency_memberships')
export class AgencyMembership {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @Column()
  agencyId: string;

  @ManyToOne(() => Agency, (agency) => agency.memberships, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'agencyId' })
  agency: Agency;

  @Column({
    type: 'enum',
    enum: AgencyRole,
    default: AgencyRole.VIEWER,
  })
  role: AgencyRole;

  @CreateDateColumn()
  createdAt: Date;
}