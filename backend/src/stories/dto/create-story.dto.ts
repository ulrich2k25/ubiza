import { IsBoolean, IsOptional } from 'class-validator';

export class CreateStoryDto {
  @IsOptional()
  @IsBoolean()
  faceBlurRequested?: boolean;
}
