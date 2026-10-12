import {
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';

import { UserRole, UserStatus } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { AdminUsersService } from './admin-users.service';

describe('AdminUsersService - Moderation', () => {
  let service: AdminUsersService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const validUser = () => ({
    id: 'user-1',
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
    deletedAt: null,
    emailVerifiedAt: new Date('2026-01-01'),
  });

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    service = module.get(AdminUsersService);
  });

  it('interdit la suspension de son propre compte', async () => {
    await expect(
      service.suspend('admin-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(prismaMock.user.updateMany).not.toHaveBeenCalled();
  });

  it('interdit la suspension d un administrateur', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser(),
      role: UserRole.ADMIN,
    });

    await expect(
      service.suspend('user-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('suspend correctement un utilisateur actif', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce(validUser())
      .mockResolvedValueOnce({
        ...validUser(),
        status: UserStatus.SUSPENDED,
      });

    prismaMock.user.updateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      service.suspend('user-1', 'admin-1'),
    ).resolves.toMatchObject({
      status: UserStatus.SUSPENDED,
    });

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'user-1',
          status: UserStatus.ACTIVE,
        }),
        data: {
          status: UserStatus.SUSPENDED,
        },
      }),
    );
  });

  it('detecte une modification concurrente du statut', async () => {
    prismaMock.user.findUnique.mockResolvedValue(validUser());

    prismaMock.user.updateMany.mockResolvedValue({
      count: 0,
    });

    await expect(
      service.suspend('user-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('reactive un utilisateur avec email verifie', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        ...validUser(),
        status: UserStatus.SUSPENDED,
      })
      .mockResolvedValueOnce({
        ...validUser(),
        status: UserStatus.ACTIVE,
      });

    prismaMock.user.updateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      service.reactivate('user-1', 'admin-1'),
    ).resolves.toMatchObject({
      status: UserStatus.ACTIVE,
    });

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: UserStatus.ACTIVE,
        },
      }),
    );
  });

  it('demande une verification si email non verifie', async () => {
    prismaMock.user.findUnique
      .mockResolvedValueOnce({
        ...validUser(),
        status: UserStatus.SUSPENDED,
        emailVerifiedAt: null,
      })
      .mockResolvedValueOnce({
        ...validUser(),
        status: UserStatus.PENDING_VERIFICATION,
        emailVerifiedAt: null,
      });

    prismaMock.user.updateMany.mockResolvedValue({
      count: 1,
    });

    await expect(
      service.reactivate('user-1', 'admin-1'),
    ).resolves.toMatchObject({
      status: UserStatus.PENDING_VERIFICATION,
    });

    expect(prismaMock.user.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: UserStatus.PENDING_VERIFICATION,
        },
      }),
    );
  });

  it('interdit la reactivation d un compte supprime', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...validUser(),
      status: UserStatus.DELETED,
      deletedAt: new Date(),
    });

    await expect(
      service.reactivate('user-1', 'admin-1'),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});