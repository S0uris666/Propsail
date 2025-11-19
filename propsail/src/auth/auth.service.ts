import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';

export interface LoginChallengeResponse {
  challengeId: string;
  expiresAt: string;
  message: string;
}

@Injectable()
export class AuthService {
  private readonly twoFactorTokenTtlMinutes: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
  ) {
    this.twoFactorTokenTtlMinutes = Math.max(
      1,
      this.getNumberConfig('TWO_FACTOR_TOKEN_TTL_MINUTES', 10),
    );
  }

  async login(dto: LoginDto): Promise<LoginChallengeResponse> {
    const identifier = this.normalizeIdentifier(dto.identifier);
    const user = await this.usersService.findByEmailOrUsername(identifier);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Credenciales inv\u00E1lidas');
    }

    const isPasswordValid = await this.securityService.verifyPassword(
      user.passwordHash,
      dto.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inv\u00E1lidas');
    }

    return this.createTwoFactorChallenge(user);
  }

  private async createTwoFactorChallenge(
    user: User,
  ): Promise<LoginChallengeResponse> {
    const token = this.securityService.generateNumericCode(6);
    const expiresAt = this.addMinutes(
      new Date(),
      this.twoFactorTokenTtlMinutes,
    );

    const record = await this.prisma.$transaction(async (transaction) => {
      await transaction.twoFactorToken.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      return transaction.twoFactorToken.create({
        data: {
          userId: user.id,
          token,
          expiresAt,
          used: false,
        },
      });
    });

    await this.emailService.sendTwoFactorToken(user.email, token, expiresAt);

    return {
      challengeId: record.id,
      expiresAt: record.expiresAt.toISOString(),
      message: 'Se envió un token de verificación a tu correo registrado.',
    };
  }

  private addMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
  }

  private getNumberConfig(key: string, fallback: number): number {
    const value = this.configService.get<string | number>(key);
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string' && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isNaN(parsed) ? fallback : parsed;
    }
    return fallback;
  }

  private normalizeIdentifier(value: string): string {
    return value.trim().toLowerCase();
  }
}
