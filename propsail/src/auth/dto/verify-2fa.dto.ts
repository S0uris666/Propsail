import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

const sanitize = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

export class Verify2FADto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => sanitize(value))
  challengeId!: string;

  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'El token debe tener exactamente 6 dígitos.',
  })
  @Transform(({ value }) => sanitize(value))
  token!: string;
}
