import {
  IsInt,
  IsNotEmpty,
  IsUUID,
  Max,
  Min,
  IsOptional,
} from 'class-validator';

export class CreateRatingDto {
  @IsNotEmpty({ message: 'Store ID is required' })
  @IsUUID('4', { message: 'Store ID must be a valid UUID' })
  storeId: string;

  @IsNotEmpty({ message: 'Rating is required' })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;
}

export class UpdateRatingDto {
  @IsNotEmpty({ message: 'Rating is required' })
  @IsInt({ message: 'Rating must be an integer' })
  @Min(1, { message: 'Rating must be at least 1' })
  @Max(5, { message: 'Rating must not exceed 5' })
  rating: number;
}