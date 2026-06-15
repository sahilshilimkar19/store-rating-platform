import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

export class CreateStoreDto {
  @IsString()
  @IsNotEmpty({ message: 'Store name is required' })
  @MaxLength(60, { message: 'Name must not exceed 60 characters' })
  name: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(400, { message: 'Address must not exceed 400 characters' })
  address?: string;

  /** Optional link to the owning store_owner user account. */
  @IsOptional()
  @IsUUID('4', { message: 'owner_id must be a valid UUID' })
  owner_id?: string;
}
