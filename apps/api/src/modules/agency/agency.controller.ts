import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AgencyService } from '../services/agency.service';
import { CreateAgencyDto } from '../dto/create-agency.dto';
import { AddMemberDto } from '../dto/add-member.dto';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('agencies')
@UseGuards(JwtAuthGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  create(@Body() dto: CreateAgencyDto) {
    return this.agencyService.create(dto);
  }

  @Post(':id/members')
  addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    return this.agencyService.addMember(id, dto);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.agencyService.getAgency(id);
  }

  @Get()
  myAgencies(@Req() req: any) {
    return this.agencyService.listUserAgencies(req.user.id);
  }
}