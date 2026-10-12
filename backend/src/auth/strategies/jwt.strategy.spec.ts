import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { UserStatus } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy - Account Security', () => {
  let strategy: JwtStrategy;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
    },
  };

  const payload = {
    sub: 'user-1',
    email: 'user@example.com',
    role: 'USER',
  };

  const activeUser = {
    id: 'user-1',
    email: 'user@example.com',
    role: 'USER',
    status: UserStatus.ACTIVE,
    deletedAt: null,
  };

  beforeEach(() => {
    jest.clearAllMocks();

    const configMock = {
      get: jest.fn().mockReturnValue('test-jwt-secret'),
    };

    strategy = new JwtStrategy(
      configMock as unknown as ConfigService,
      prismaMock as unknown as PrismaService,
    );
  });

  it('autorise un utilisateur actif', async () => {
    prismaMock.user.findUnique.mockResolvedValue(activeUser);

    await expect(strategy.validate(payload)).resolves.toEqual({
      id: activeUser.id,
      email: activeUser.email,
      role: activeUser.role,
    });
  });

  it('refuse un utilisateur suspendu', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...activeUser,
      status: UserStatus.SUSPENDED,
    });

    await expect(
      strategy.validate(payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un utilisateur avec statut DELETED', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...activeUser,
      status: UserStatus.DELETED,
    });

    await expect(
      strategy.validate(payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('refuse un utilisateur avec deletedAt renseigne', async () => {
    prismaMock.user.findUnique.mockResolvedValue({
      ...activeUser,
      deletedAt: new Date(),
    });

    await expect(
      strategy.validate(payload),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});