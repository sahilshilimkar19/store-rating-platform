import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';
import { Role } from '../../common/enums/role.enum';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from '../../auth/dto/password.constraints';

/**
 * Admin-side user creation. Same field rules as registration, plus an explicit
 * role (admin / normal / store_owner).
 */
export class CreateUserDto {
  @IsString()
  @Length(20, 60, { message: 'Name must be between 20 and 60 characters' })
  name: string;

  @IsEmail({}, { message: 'A valid email address is required' })
  @MaxLength(255)
  email: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: PASSWORD_MESSAGE,
  })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  password: string;

  @IsOptional()
  @IsString()
  @MaxLength(400, { message: 'Address must not exceed 400 characters' })
  address?: string;

  @IsEnum(Role, { message: 'Role must be one of: admin, normal, store_owner' })
  role: Role;
}
