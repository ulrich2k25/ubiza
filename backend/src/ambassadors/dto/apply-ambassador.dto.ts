import { IsBoolean, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class ApplyAmbassadorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  mobileMoneyNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  whatsappNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  identityNumber!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country!: string;

  @IsBoolean()
  acceptTerms!: boolean;
}
