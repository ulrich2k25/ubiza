import {
  Controller,
  DefaultValuePipe,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import { UserRole, UserStatus } from '../../generated/prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AdminUsersService } from './admin-users.service';

interface AdminAuthenticatedRequest {
  user: {
    id: string;
  };
}

@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  // ==========================================
  // Liste des utilisateurs
  // ==========================================

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

  // ==========================================
  // Statistiques
  // ==========================================

  @Get('statistics')
  getStatistics() {
    return this.adminUsersService.getStatistics();
  }

  // ==========================================
  // Détails utilisateur
  // ==========================================

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  // ==========================================
  // Suspension utilisateur
  // ==========================================

  @Patch(':id/suspend')
  suspend(
    @Param('id') id: string,
    @Request() request: AdminAuthenticatedRequest,
  ) {
    return this.adminUsersService.suspend(id, request.user.id);
  }

  // ==========================================
  // Réactivation utilisateur
  // ==========================================

  @Patch(':id/reactivate')
  reactivate(
    @Param('id') id: string,
    @Request() request: AdminAuthenticatedRequest,
  ) {
    return this.adminUsersService.reactivate(id, request.user.id);
  }
}
