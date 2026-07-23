import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class CreateImageDto {
  @IsString()
  url!: string;

  @IsOptional()
  @IsString()
  publicId?: string;

  @IsOptional()
  @IsBoolean()
  faceBlurRequested?: boolean;
}
