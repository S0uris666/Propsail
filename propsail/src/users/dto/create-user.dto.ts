import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

const sanitizeLowercase = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim().toLowerCase() : undefined;
const sanitize = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

export class CreateUserDto {
  @IsEmail()
  @Transform(({ value }) => sanitizeLowercase(value))
  email!: string;

  @IsString()
  @MinLength(3)
  @Transform(({ value }) => sanitize(value))
  username!: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => sanitize(value))
  fullName?: string;

  @IsString()
  @MinLength(8)
  @Matches(/[A-Za-z]/, {
    message: 'La contraseña debe incluir al menos una letra.',
  })
  @Matches(/\d/, {
    message: 'La contraseña debe incluir al menos un número.',
  })
  password!: string;
}
