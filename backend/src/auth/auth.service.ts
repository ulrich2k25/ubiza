import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'crypto';

import { BCRYPT_ROUNDS } from '../common/constants/auth.constants';
import { MailService } from '../mail/mail.service';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileService } from '../profile/profile.service';
import { TrustService } from '../trust/trust.service';

import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly trustService: TrustService,
    private readonly profileService: ProfileService,
    private readonly mailService: MailService,
  ) {}

  private async generateUniqueReferralCode(username: string): Promise<string> {
    const usernamePart =
      username
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 12) || 'UBIZA';

    for (let attempt = 0; attempt < 10; attempt += 1) {
      const randomPart = randomBytes(3).toString('hex').toUpperCase();

      const referralCode = `${usernamePart}-${randomPart}`;

      const existingCode = await this.prisma.user.findUnique({
        where: {
          referralCode,
        },
        select: {
          id: true,
        },
      });

      if (!existingCode) {
        return referralCode;
      }
    }

    throw new InternalServerErrorException(
      'Impossible de générer un code de parrainage unique.',
    );
  }

  private generateEmailVerificationToken(): {
    rawToken: string;
    hashedToken: string;
    expiresAt: Date;
  } {
    const rawToken = randomBytes(32).toString('hex');

    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    return {
      rawToken,
      hashedToken,
      expiresAt,
    };
  }

  async verifyEmail(rawToken: string) {
    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const verificationToken = await this.prisma.verificationToken.findUnique({
      where: {
        token: hashedToken,
      },
    });

    if (!verificationToken) {
      throw new BadRequestException('Token de vérification invalide.');
    }

    if (verificationToken.usedAt) {
      throw new BadRequestException(
        'Ce token de vérification a déjà été utilisé.',
      );
    }

    if (verificationToken.expiresAt < new Date()) {
      throw new BadRequestException('Ce token de vérification a expiré.');
    }

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: verificationToken.userId,
        },
        data: {
          emailVerifiedAt: new Date(),
          status: 'ACTIVE',
        },
      }),

      this.prisma.verificationToken.update({
        where: {
          id: verificationToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    await this.profileService.refreshVerificationStatus(
      verificationToken.userId,
    );

    return {
      message: 'Adresse e-mail vérifiée avec succès.',
    };
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();
    const normalizedUsername = dto.username.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
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
      select: {
        id: true,
      },
    });

    if (existingUsername) {
      throw new ConflictException('Ce pseudo est déjà utilisé.');
    }

    let referredById: string | null = null;

    if (dto.referralCode?.trim()) {
      const normalizedReferralCode = dto.referralCode.trim().toUpperCase();

      const referrer = await this.prisma.user.findUnique({
        where: {
          referralCode: normalizedReferralCode,
        },
        select: {
          id: true,
        },
      });

      if (!referrer) {
        throw new BadRequestException(
          'Le code de parrainage fourni est invalide.',
        );
      }

      referredById = referrer.id;
    }

    const referralCode =
      await this.generateUniqueReferralCode(normalizedUsername);

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);

    const emailVerificationToken = this.generateEmailVerificationToken();

    const premiumTrialStartedAt = new Date();

    const premiumActiveUntil = new Date(premiumTrialStartedAt);
    premiumActiveUntil.setDate(premiumActiveUntil.getDate() + 7);

    const displayName = `${dto.firstName.trim()} ${dto.lastName.trim()}`;

    let user;

    try {
      user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          referralCode,
          referredById,

          premiumTrialUsed: true,
          premiumTrialStartedAt,
          premiumActiveUntil,

          profile: {
            create: {
              username: normalizedUsername,
              displayName,
            },
          },

          settings: {
            create: {},
          },

          premiumSubscriptions: {
            create: {
              plan: 'TRIAL_7_DAYS',
              source: 'TRIAL',
              status: 'ACTIVE',
              startsAt: premiumTrialStartedAt,
              endsAt: premiumActiveUntil,
            },
          },

          verificationTokens: {
            create: {
              token: emailVerificationToken.hashedToken,
              type: 'EMAIL_VERIFICATION',
              expiresAt: emailVerificationToken.expiresAt,
            },
          },
        },

        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          referralCode: true,
          createdAt: true,

          premiumTrialUsed: true,
          premiumTrialStartedAt: true,
          premiumActiveUntil: true,

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
    } catch {
      throw new InternalServerErrorException(
        'Une erreur est survenue lors de la création du compte.',
      );
    }

    try {
      await this.mailService.sendVerificationEmail(
        user.email,
        emailVerificationToken.rawToken,
      );
    } catch {
      throw new InternalServerErrorException(
        'Le compte a été créé, mais l’e-mail de vérification n’a pas pu être envoyé.',
      );
    }

    return {
      message:
        'Compte créé avec succès. Un e-mail de vérification vous a été envoyé.',
      user,
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email: normalizedEmail,
      },
      select: {
        id: true,
        email: true,
      },
    });

    // Réponse volontairement identique même si l'utilisateur n'existe pas.
    // Cela évite de révéler quelles adresses sont inscrites.
    if (!user) {
      return {
        message:
          'Si un compte existe avec cette adresse e-mail, un lien de réinitialisation a été envoyé.',
      };
    }

    const rawToken = randomBytes(32).toString('hex');

    const hashedToken = createHash('sha256').update(rawToken).digest('hex');

    const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.verificationToken.deleteMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET',
          usedAt: null,
        },
      }),

      this.prisma.verificationToken.create({
        data: {
          userId: user.id,
          token: hashedToken,
          type: 'PASSWORD_RESET',
          expiresAt,
        },
      }),
    ]);

    await this.mailService.sendPasswordResetEmail(user.email, rawToken);

    return {
      message:
        'Si un compte existe avec cette adresse e-mail, un lien de réinitialisation a été envoyé.',
    };
  }

  async resetPassword(token: string, password: string) {
    const hashedToken = createHash('sha256').update(token).digest('hex');

    const resetToken = await this.prisma.verificationToken.findUnique({
      where: {
        token: hashedToken,
      },
    });

    if (!resetToken || resetToken.type !== 'PASSWORD_RESET') {
      throw new BadRequestException(
        'Le lien de réinitialisation est invalide.',
      );
    }

    if (resetToken.usedAt) {
      throw new BadRequestException(
        'Ce lien de réinitialisation a déjà été utilisé.',
      );
    }

    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestException('Ce lien de réinitialisation a expiré.');
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: {
          id: resetToken.userId,
        },
        data: {
          passwordHash,
        },
      }),

      this.prisma.verificationToken.update({
        where: {
          id: resetToken.id,
        },
        data: {
          usedAt: new Date(),
        },
      }),

      this.prisma.verificationToken.updateMany({
        where: {
          userId: resetToken.userId,
          type: 'PASSWORD_RESET',
          usedAt: null,
          id: {
            not: resetToken.id,
          },
        },
        data: {
          usedAt: new Date(),
        },
      }),
    ]);

    return {
      message:
        'Votre mot de passe a été réinitialisé avec succès. Vous pouvez maintenant vous connecter.',
    };
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
