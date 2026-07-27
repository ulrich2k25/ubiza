import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateListingDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  description?: string;

  @IsOptional()
  @IsInt()
  @Min(18)
  @Max(99)
  age?: number;

  @IsOptional()
  @IsString()
  categoryId?: string;

  @IsOptional()
  @IsString()
  cityId?: string;

  @IsOptional()
  @IsBoolean()
  availableNow?: boolean;

  @IsOptional()
  @IsBoolean()
  allowPhone?: boolean;

  @IsOptional()
  @IsBoolean()
  allowWhatsapp?: boolean;

  @IsOptional()
  @IsBoolean()
  allowTelegram?: boolean;

  @IsOptional()
  @IsBoolean()
  allowInstagram?: boolean;

  @IsOptional()
  @IsBoolean()
  automaticFaceBlur?: boolean;
}
