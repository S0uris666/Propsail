import { BadRequestException, Injectable } from '@nestjs/common';
import { compare, hash } from 'bcrypt';
import { randomBytes, randomInt } from 'node:crypto';

const BCRYPT_ROUNDS = 12;

@Injectable()
export class SecurityService {
  validatePasswordStrength(password: string): void {
    const minLength = 8;
    const hasLetter = /[A-Za-z]/.test(password);
    const hasNumber = /\d/.test(password);

    if (password.length < minLength || !hasLetter || !hasNumber) {
      throw new BadRequestException(
        'La contraseña debe tener al menos 8 caracteres, una letra y un número.',
      );
    }
  }

  hashPassword(password: string): Promise<string> {
    return hash(password, BCRYPT_ROUNDS);
  }

  verifyPassword(hash: string, password: string): Promise<boolean> {
    return compare(password, hash);
  }

  generateNumericCode(length = 6): string {
    return Array.from({ length })
      .map(() => randomInt(0, 10))
      .join('');
  }

  generateRandomToken(bytes = 32): string {
    return randomBytes(bytes).toString('hex');
  }
}
