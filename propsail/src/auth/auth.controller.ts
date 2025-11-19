import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import type { AuthTokenResponse, LoginChallengeResponse } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { Verify2FADto } from './dto/verify-2fa.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto): Promise<LoginChallengeResponse> {
    return this.authService.login(dto);
  }

  @Post('verify-2fa')
  @HttpCode(HttpStatus.OK)
  verifyTwoFactor(@Body() dto: Verify2FADto): Promise<AuthTokenResponse> {
    return this.authService.verifyTwoFactor(dto);
  }
}
