import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileContactDto {
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  whatsapp?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  telegram?: string | null;
}
