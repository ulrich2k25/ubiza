import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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

  @IsInt()
  @Min(18)
  @Max(99)
  age!: number;

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
