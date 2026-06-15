import { IsInt, IsUUID, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @IsUUID('all', { message: 'store_id must be a valid UUID' })
  store_id: string;

  @IsInt({ message: 'value must be an integer between 1 and 5' })
  @Min(1, { message: 'value must be between 1 and 5' })
  @Max(5, { message: 'value must be between 1 and 5' })
  value: number;
}
