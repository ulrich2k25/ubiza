import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export enum InitiatePaymentPurpose {
  PREMIUM = 'PREMIUM',
  BOOST = 'BOOST',
}

export enum PurchasablePremiumPlan {
  DAY_1 = 'DAY_1',
  DAYS_7 = 'DAYS_7',
  DAYS_30 = 'DAYS_30',
}

export enum PurchasableBoostDuration {
  MINUTES_60 = 'MINUTES_60',
}

export class InitiatePaymentDto {
  @IsEnum(InitiatePaymentPurpose)
  purpose!: InitiatePaymentPurpose;

  @IsOptional()
  @IsEnum(PurchasablePremiumPlan)
  premiumPlan?: PurchasablePremiumPlan;

  @IsOptional()
  @IsEnum(PurchasableBoostDuration)
  boostDuration?: PurchasableBoostDuration;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Le numéro de téléphone est invalide.',
  })
  customerPhone?: string;
}
