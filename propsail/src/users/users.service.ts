import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma, User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SecurityService } from '../security/security.service';
import { CreateUserDto } from './dto/create-user.dto';

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly securityService: SecurityService,
  ) {}

  async create(dto: CreateUserDto): Promise<PublicUser> {
    this.securityService.validatePasswordStrength(dto.password);
    const passwordHash = await this.securityService.hashPassword(dto.password);

    const username = dto.username.toLowerCase();

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          username,
          fullName: dto.fullName,
          passwordHash,
        },
      });

      return this.toPublicUser(user);
    } catch (error) {
      if (this.isUniqueConstraint(error)) {
        throw new ConflictException('El correo o usuario ya existe.');
      }
      throw error;
    }
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const normalized = identifier.trim().toLowerCase();
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: normalized }, { username: normalized }],
      },
    });
  }

  toPublicUser(user: User): PublicUser {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = user;
    return rest;
  }

  private isUniqueConstraint(
    error: unknown,
  ): error is Prisma.PrismaClientKnownRequestError {
    return (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    );
  }
}
