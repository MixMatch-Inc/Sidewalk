import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Agency } from './entities/agency.entity';
import { AgencyMembership } from './entities/agency-membership.entity';
import { AgencyService } from './services/agency.service';
import { AgencyController } from './controllers/agency.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, AgencyMembership])],
  providers: [AgencyService],
  controllers: [AgencyController],
  exports: [AgencyService],
})
export class AgencyModule {}