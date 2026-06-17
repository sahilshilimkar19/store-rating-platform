import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import {
  PASSWORD_MAX_LENGTH,
  PASSWORD_MESSAGE,
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN,
} from '../../auth/dto/password.constraints';

/**
 * Self-service password change (Normal User / Store Owner). The current
 * password must be supplied and verified before the new one is applied.
 */
export class UpdatePasswordDto {
  @IsString()
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @IsString()
  @Length(PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH, {
    message: PASSWORD_MESSAGE,
  })
  @Matches(PASSWORD_PATTERN, { message: PASSWORD_MESSAGE })
  newPassword: string;
}
