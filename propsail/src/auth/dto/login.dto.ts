import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

const sanitizeIdentifier = (value: unknown): string | undefined =>
  typeof value === 'string' ? value.trim() : undefined;

export class LoginDto {
  @IsString()
  @MinLength(3)
  @Transform(({ value }) => sanitizeIdentifier(value))
  identifier!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;
}
