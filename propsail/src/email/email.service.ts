import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  sendTwoFactorToken(
    destination: string,
    _token: string,
    expiresAt: Date,
  ): Promise<void> {
    this.logger.log(
      `Token 2FA emitido para ${destination}. Expira ${expiresAt.toISOString()}.`,
    );
    return Promise.resolve();
  }
}
