import {
  IsEnum,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

import { InitiatePaymentDto } from './initiate-payment.dto';

export enum ManualPaymentOperator {
  MTN = 'MTN',
  ORANGE = 'ORANGE',
}

export class SubmitManualPaymentDto extends InitiatePaymentDto {
  @IsEnum(ManualPaymentOperator)
  operator!: ManualPaymentOperator;

  @IsString()
  @Matches(/^\+?[1-9]\d{7,14}$/, {
    message: 'Le numéro ayant effectué le paiement est invalide.',
  })
  payerPhone!: string;

  @IsString()
  @MinLength(3, {
    message: 'La référence de transaction est trop courte.',
  })
  @MaxLength(100, {
    message: 'La référence de transaction est trop longue.',
  })
  transactionReference!: string;
}
