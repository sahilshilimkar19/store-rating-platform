import { IsInt, Max, Min } from 'class-validator';

export class UpdateRatingDto {
  @IsInt({ message: 'value must be an integer between 1 and 5' })
  @Min(1, { message: 'value must be between 1 and 5' })
  @Max(5, { message: 'value must be between 1 and 5' })
  value: number;
}
