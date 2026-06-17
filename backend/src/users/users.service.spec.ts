import {
  BadRequestException,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from './entities/user.entity';
import { UsersService } from './users.service';

jest.mock('bcrypt');

const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

/** Chainable query-builder stub for the change-password / avg-rating paths. */
function qbMock(results: { getOne?: unknown; getRawOne?: unknown }) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of ['select', 'addSelect', 'innerJoin', 'where']) {
    qb[m] = jest.fn(() => qb);
  }
  qb.getOne = jest.fn().mockResolvedValue(results.getOne ?? null);
  qb.getRawOne = jest.fn().mockResolvedValue(results.getRawOne ?? null);
  return qb;
}

describe('UsersService', () => {
  let service: UsersService;
  let userRepo: jest.Mocked<Repository<User>>;
  let ratingRepo: jest.Mocked<Repository<Rating>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Rating),
          useValue: { createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(UsersService);
    userRepo = moduleRef.get(getRepositoryToken(User));
    ratingRepo = moduleRef.get(getRepositoryToken(Rating));

    mockedBcrypt.hash.mockResolvedValue('hashed-password' as never);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createUser', () => {
    const dto = {
      name: 'Valid Display Name Account',
      email: 'New@Example.com',
      password: 'Password@1',
      role: Role.NORMAL,
    };

    it('throws Conflict when the email already exists', async () => {
      userRepo.findOne.mockResolvedValue({ id: 'u1' } as User);
      await expect(service.createUser(dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('normalizes the email, hashes the password, and returns a safe user', async () => {
      userRepo.findOne.mockResolvedValue(null);
      userRepo.create.mockImplementation((u) => u as User);
      userRepo.save.mockImplementation(
        async (u) => ({ id: 'u1', createdAt: new Date(), updatedAt: new Date(), ...u }) as User,
      );

      const result = await service.createUser(dto);

      expect(userRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'new@example.com' },
      });
      expect(mockedBcrypt.hash).toHaveBeenCalled();
      expect(result.email).toBe('new@example.com');
      expect((result as Record<string, unknown>).password).toBeUndefined();
    });
  });

  describe('getUserDetail', () => {
    it('throws NotFound when the user does not exist', async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserDetail('missing')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('includes avgRating for a store owner', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'owner-1',
        name: 'Owner Account Display Name',
        email: 'owner@example.com',
        address: null,
        role: Role.STORE_OWNER,
      } as User);
      ratingRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getRawOne: { avg: '4.5' } }) as never,
      );

      const detail = await service.getUserDetail('owner-1');
      expect(detail.avgRating).toBe(4.5);
    });

    it('omits avgRating for a non-owner', async () => {
      userRepo.findOne.mockResolvedValue({
        id: 'n1',
        name: 'Normal Account Display Name',
        email: 'normal@example.com',
        address: null,
        role: Role.NORMAL,
      } as User);

      const detail = await service.getUserDetail('n1');
      expect(detail.avgRating).toBeUndefined();
      expect(ratingRepo.createQueryBuilder).not.toHaveBeenCalled();
    });
  });

  describe('changePassword', () => {
    it('throws Unauthorized when the current password is wrong', async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: { id: 'u1', password: 'stored' } }) as never,
      );
      mockedBcrypt.compare.mockResolvedValueOnce(false as never);

      await expect(
        service.changePassword('u1', 'wrong', 'NewPass@1'),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('throws BadRequest when the new password equals the current one', async () => {
      userRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: { id: 'u1', password: 'stored' } }) as never,
      );
      // First compare (current) -> true; second compare (new == current) -> true.
      mockedBcrypt.compare
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(true as never);

      await expect(
        service.changePassword('u1', 'Current@1', 'Current@1'),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('updates the password when current is correct and new differs', async () => {
      const user = { id: 'u1', password: 'stored' };
      userRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: user }) as never,
      );
      mockedBcrypt.compare
        .mockResolvedValueOnce(true as never)
        .mockResolvedValueOnce(false as never);
      userRepo.save.mockResolvedValue(user as User);

      const result = await service.changePassword(
        'u1',
        'Current@1',
        'NewPass@1',
      );
      expect(result).toEqual({ message: 'Password updated successfully' });
      expect(userRepo.save).toHaveBeenCalled();
    });
  });
});
