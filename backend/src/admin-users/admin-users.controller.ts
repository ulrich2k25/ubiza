import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';

import { UserRole, UserStatus } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AdminUsersService } from './admin-users.service';

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe)
    page: number,

    @Query('limit', new DefaultValuePipe(20), ParseIntPipe)
    limit: number,

    @Query('search')
    search?: string,

    @Query(
      'status',
      new ParseEnumPipe(UserStatus, {
        optional: true,
      }),
    )
    status?: UserStatus,

    @Query(
      'role',
      new ParseEnumPipe(UserRole, {
        optional: true,
      }),
    )
    role?: UserRole,
  ) {
    return this.adminUsersService.findAll(page, limit, search, status, role);
  }

  @Get('statistics')
  getStatistics() {
    return this.adminUsersService.getStatistics();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }
}
