import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Role } from '../common/enums/role.enum';
import { SafeUser, UsersService } from '../users/users.service';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/**
 * Orchestrates authentication. All user-table access is delegated to
 * UsersService, which is the single source of truth for the users table.
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Self-service signup. Role is hard-coded to NORMAL — this endpoint can never
   * be used to create an admin or store owner.
   */
  async register(dto: RegisterDto): Promise<{ user: SafeUser }> {
    const user = await this.usersService.createUser({
      ...dto,
      role: Role.NORMAL,
    });
    return { user };
  }

  /**
   * Single login endpoint for all roles. Returns the signed access token plus
   * the safe user object (including role) so the frontend can route by role.
   */
  async login(dto: LoginDto): Promise<{ accessToken: string; user: SafeUser }> {
    const user = await this.usersService.findByEmail(dto.email, true);

    // Same generic error whether the email or the password is wrong, to avoid
    // leaking which accounts exist.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: await this.signToken(user),
      user: this.usersService.toSafeUser(user),
    };
  }

  /** Authenticated password change for the current user (any role). */
  changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return this.usersService.changePassword(
      userId,
      dto.currentPassword,
      dto.newPassword,
    );
  }

  private signToken(user: {
    id: string;
    email: string;
    role: Role;
  }): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }
}
