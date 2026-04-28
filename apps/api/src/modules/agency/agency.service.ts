import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Agency } from '../entities/agency.entity';
import { AgencyMembership } from '../entities/agency-membership.entity';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { AddMemberDto } from '../dto/add-member.dto';

@Injectable()
export class AgencyService {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepo: Repository<Agency>,

    @InjectRepository(AgencyMembership)
    private readonly membershipRepo: Repository<AgencyMembership>,
  ) {}

  async create(dto: CreateAgencyDto): Promise<Agency> {
    const agency = this.agencyRepo.create(dto);
    return this.agencyRepo.save(agency);
  }

  async addMember(agencyId: string, dto: AddMemberDto) {
    const exists = await this.membershipRepo.findOne({
      where: {
        agencyId,
        userId: dto.userId,
      },
    });

    if (exists) {
      throw new ConflictException('User already in agency');
    }

    return this.membershipRepo.save(
      this.membershipRepo.create({
        agencyId,
        userId: dto.userId,
        role: dto.role,
      }),
    );
  }

  async getAgency(agencyId: string) {
    const agency = await this.agencyRepo.findOne({
      where: { id: agencyId },
      relations: ['memberships'],
    });

    if (!agency) throw new NotFoundException('Agency not found');

    return agency;
  }

  async listUserAgencies(userId: string) {
    return this.membershipRepo.find({
      where: { userId },
      relations: ['agency'],
    });
  }
}