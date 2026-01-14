import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './user.entity';
import { CreateUserDto, UpdateUserDto, UpdatePasswordDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const user = this.usersRepository.create({
      ...createUserDto,
      passwordHash: hashedPassword,
    });

    return await this.usersRepository.save(user);
  }

  async findAll(filters?: {
    name?: string;
    email?: string;
    address?: string;
    role?: UserRole;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }): Promise<User[]> {
    const query = this.usersRepository.createQueryBuilder('user');

    if (filters?.name) {
      query.andWhere('user.name LIKE :name', { name: `%${filters.name}%` });
    }

    if (filters?.email) {
      query.andWhere('user.email LIKE :email', { email: `%${filters.email}%` });
    }

    if (filters?.address) {
      query.andWhere('user.address LIKE :address', {
        address: `%${filters.address}%`,
      });
    }

    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    const sortBy = filters?.sortBy || 'createdAt';
    const sortOrder = filters?.sortOrder || 'DESC';
    query.orderBy(`user.${sortBy}`, sortOrder);

    return await query.getMany();
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['stores', 'ratings'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(user, updateUserDto);
    return await this.usersRepository.save(user);
  }

  async updatePassword(id: string, updatePasswordDto: UpdatePasswordDto): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const isPasswordValid = await bcrypt.compare(
      updatePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    user.passwordHash = await bcrypt.hash(updatePasswordDto.newPassword, 10);
    await this.usersRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.remove(user);
  }

  async getStats(): Promise<{ totalUsers: number; totalAdmins: number; totalStoreOwners: number }> {
    const totalUsers = await this.usersRepository.count();
    const totalAdmins = await this.usersRepository.count({
      where: { role: UserRole.ADMIN },
    });
    const totalStoreOwners = await this.usersRepository.count({
      where: { role: UserRole.STORE_OWNER },
    });

    return { totalUsers, totalAdmins, totalStoreOwners };
  }
}