import { IsEmail } from 'class-validator';

export class ForgotPasswordDto {
  @IsEmail({}, { message: 'Adresse e-mail invalide.' })
  email!: string;
}
