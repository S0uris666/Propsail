import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { EmailModule } from '../email/email.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SecurityModule } from '../security/security.module';
import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    ConfigModule,
    JwtModule.register({}),
    UsersModule,
    PrismaModule,
    SecurityModule,
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
