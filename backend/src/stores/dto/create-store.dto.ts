import {
  IsEmail,
  IsNotEmpty,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
  IsOptional,
} from 'class-validator';

export class CreateStoreDto {
  @IsNotEmpty({ message: 'Store name is required' })
  @IsString()
  @MinLength(20, { message: 'Store name must be at least 20 characters long' })
  @MaxLength(60, { message: 'Store name must not exceed 60 characters' })
  name: string;

  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  @MaxLength(400, { message: 'Address must not exceed 400 characters' })
  address: string;

  @IsNotEmpty({ message: 'Owner ID is required' })
  @IsUUID('4', { message: 'Owner ID must be a valid UUID' })
  ownerId: string;
}

export class UpdateStoreDto {
  @IsOptional()
  @IsString()
  @MinLength(20)
  @MaxLength(60)
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(400)
  address?: string;
}

export class StoreQueryDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC';
}