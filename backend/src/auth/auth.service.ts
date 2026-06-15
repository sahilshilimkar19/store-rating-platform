import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { User } from '../users/entities/user.entity';
import { ChangePasswordDto } from './dto/change-password.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';

/** User fields safe to expose to clients (never includes the password hash). */
export type SafeUser = Pick<
  User,
  'id' | 'name' | 'email' | 'address' | 'role' | 'createdAt' | 'updatedAt'
>;

@Injectable()
export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Self-service signup. Always creates a NORMAL user — the role is never taken
   * from client input, so this endpoint cannot be used to mint admins.
   */
  async register(dto: RegisterDto): Promise<{ user: SafeUser }> {
    const email = dto.email.toLowerCase().trim();

    const existing = await this.userRepository.findOne({ where: { email } });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const user = this.userRepository.create({
      name: dto.name,
      email,
      password: await this.hashPassword(dto.password),
      address: dto.address ?? null,
      role: Role.NORMAL,
    });

    const saved = await this.userRepository.save(user);
    return { user: this.toSafeUser(saved) };
  }

  /**
   * Single login endpoint for all roles. Returns the signed access token plus
   * the safe user object (including role) so the frontend can route by role.
   */
  async login(
    dto: LoginDto,
  ): Promise<{ accessToken: string; user: SafeUser }> {
    const email = dto.email.toLowerCase().trim();

    // password is select:false on the entity, so re-select it explicitly.
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();

    // Same generic error whether the email or the password is wrong, to avoid
    // leaking which accounts exist.
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return {
      accessToken: await this.signToken(user),
      user: this.toSafeUser(user),
    };
  }

  /**
   * Authenticated password change. Verifies the current password before
   * applying the new one, which must differ from the current password.
   */
  async changePassword(
    userId: string,
    dto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.id = :id', { id: userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const currentMatches = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );
    if (!currentMatches) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (await bcrypt.compare(dto.newPassword, user.password)) {
      throw new BadRequestException(
        'New password must be different from the current password',
      );
    }

    user.password = await this.hashPassword(dto.newPassword);
    await this.userRepository.save(user);

    return { message: 'Password updated successfully' };
  }

  private hashPassword(plain: string): Promise<string> {
    return bcrypt.hash(plain, AuthService.SALT_ROUNDS);
  }

  private signToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    return this.jwtService.signAsync(payload);
  }

  private toSafeUser(user: User): SafeUser {
    const { id, name, email, address, role, createdAt, updatedAt } = user;
    return { id, name, email, address, role, createdAt, updatedAt };
  }
}
