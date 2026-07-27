import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { BCRYPT_ROUNDS } from '../common/constants/auth.constants';
import { TrustService } from '../trust/trust.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly trustService: TrustService,
  ) {}

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const normalizedUsername = dto.username.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
    });

    if (existingUser) {
      throw new ConflictException(
        'Un compte existe déjà avec cette adresse e-mail.',
      );
    }

    const existingUsername = await this.prisma.profile.findUnique({
      where: {
        username: normalizedUsername,
      },
    });

    if (existingUsername) {
      throw new ConflictException('Ce pseudo est déjà utilisé.');
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const displayName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;

    try {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,

          passwordHash,

          profile: {
            create: {
              username: normalizedUsername,

              displayName,
            },
          },

          settings: {
            create: {},
          },
        },

        select: {
          id: true,

          email: true,

          role: true,

          status: true,

          createdAt: true,

          profile: {
            select: {
              id: true,

              username: true,

              displayName: true,

              avatarUrl: true,
            },
          },
        },
      });

      return {
        message: 'Compte créé avec succès.',

        user,
      };
    } catch {
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la création du compte.',
      );
    }
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },

      include: {
        profile: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    const passwordIsValid = await bcrypt.compare(
      dto.password,

      user.passwordHash,
    );

    if (!passwordIsValid) {
      throw new UnauthorizedException('Email ou mot de passe incorrect.');
    }

    await this.prisma.user.update({
      where: {
        id: user.id,
      },

      data: {
        lastLoginAt: new Date(),
      },
    });

    await this.trustService.recalculateUserTrust(user.id);

    const accessToken = await this.jwtService.signAsync({
      sub: user.id,

      email: user.email,

      role: user.role,
    });

    return {
      message: 'Connexion réussie.',

      accessToken,

      user: {
        id: user.id,

        email: user.email,

        role: user.role,

        status: user.status,

        profile: user.profile,
      },
    };
  }
}
