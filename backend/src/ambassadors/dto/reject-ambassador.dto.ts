import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RejectAmbassadorDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string;
}
