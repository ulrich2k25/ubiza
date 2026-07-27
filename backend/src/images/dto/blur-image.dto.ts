import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';

export class BlurImageDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  x!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  y!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  width!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1)
  height!: number;
}
