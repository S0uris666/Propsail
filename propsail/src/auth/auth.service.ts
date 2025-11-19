import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';

export interface LoginChallengeResponse {
  challengeId: string;
  expiresAt: string;
  message: string;
}

export interface AuthTokenResponse {
  accessToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

@Injectable()
export class AuthService {
  private readonly twoFactorTokenTtlMinutes: number;
  private readonly jwtSecret: string;
  private readonly jwtExpiresInSeconds: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly securityService: SecurityService,
    private readonly emailService: EmailService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {
    this.twoFactorTokenTtlMinutes = Math.max(
      1,
      this.getNumberConfig('TWO_FACTOR_TOKEN_TTL_MINUTES', 10),
    );
    this.jwtSecret = this.getRequiredConfig('JWT_SECRET');
    this.jwtExpiresInSeconds = Math.max(
      60,
      this.getNumberConfig('JWT_EXPIRES_IN_SECONDS', 900),
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

  async verifyTwoFactor(dto: Verify2FADto): Promise<AuthTokenResponse> {
    const tokenRecord = await this.prisma.twoFactorToken.findUnique({
      where: { id: dto.challengeId },
      include: { user: true },
    });

    if (
      !tokenRecord ||
      tokenRecord.used ||
      !tokenRecord.user ||
      !tokenRecord.user.isActive
    ) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    if (tokenRecord.token !== dto.token) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    if (tokenRecord.expiresAt.getTime() <= Date.now()) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    const updateResult = await this.prisma.twoFactorToken.updateMany({
      where: { id: tokenRecord.id, used: false },
      data: { used: true },
    });

    if (updateResult.count === 0) {
      throw new UnauthorizedException('Token inv\u00E1lido o expirado');
    }

    const payload = { sub: tokenRecord.userId };
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: this.jwtExpiresInSeconds,
    });

    return {
      accessToken,
      expiresIn: this.jwtExpiresInSeconds,
      tokenType: 'Bearer',
    };
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

  private getRequiredConfig(key: string): string {
    const value = this.configService.get<string>(key);
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    throw new Error(`La variable de entorno ${key} es obligatoria.`);
  }
}
