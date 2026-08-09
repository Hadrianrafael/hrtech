import { IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitContactDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  company?: string;

  @IsEmail()
  @MaxLength(160)
  email!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  segment?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  interest?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(4000)
  message!: string;
}
