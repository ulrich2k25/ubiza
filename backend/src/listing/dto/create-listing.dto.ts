import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateListingDto {
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @IsString()
  @IsNotEmpty()
  cityId!: string;

  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title!: string;

  @IsString()
  @MinLength(20)
  @MaxLength(3000)
  description!: string;

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
