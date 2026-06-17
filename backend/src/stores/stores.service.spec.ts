import { BadRequestException, ConflictException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import { Rating } from '../ratings/entities/rating.entity';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { Store } from './entities/store.entity';
import { StoresService } from './stores.service';

describe('StoresService', () => {
  let service: StoresService;
  let storeRepo: jest.Mocked<Repository<Store>>;
  let usersService: { findById: jest.Mock };

  beforeEach(async () => {
    usersService = { findById: jest.fn() };

    const moduleRef = await Test.createTestingModule({
      providers: [
        StoresService,
        {
          provide: getRepositoryToken(Store),
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
        { provide: UsersService, useValue: usersService },
      ],
    }).compile();

    service = moduleRef.get(StoresService);
    storeRepo = moduleRef.get(getRepositoryToken(Store));
  });

  describe('createStore', () => {
    const base = {
      name: 'Corner Store',
      email: 'Store@Example.com',
      address: '1 High St',
    };

    it('throws Conflict when a store with the email exists', async () => {
      storeRepo.findOne.mockResolvedValue({ id: 's1' } as Store);
      await expect(service.createStore(base)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('throws BadRequest when owner_id does not resolve to a user', async () => {
      storeRepo.findOne.mockResolvedValue(null);
      usersService.findById.mockResolvedValue(null);

      await expect(
        service.createStore({ ...base, owner_id: 'ghost' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('throws BadRequest when owner_id is not a store_owner', async () => {
      storeRepo.findOne.mockResolvedValue(null);
      usersService.findById.mockResolvedValue({
        id: 'u1',
        role: Role.NORMAL,
      } as User);

      await expect(
        service.createStore({ ...base, owner_id: 'u1' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('creates a store (email normalized) without an owner', async () => {
      const now = new Date();
      storeRepo.findOne.mockResolvedValue(null);
      storeRepo.create.mockImplementation((s) => s as Store);
      storeRepo.save.mockResolvedValue({
        id: 's1',
        name: base.name,
        email: 'store@example.com',
        address: base.address,
        createdAt: now,
      } as Store);

      const result = await service.createStore(base);

      expect(storeRepo.findOne).toHaveBeenCalledWith({
        where: { email: 'store@example.com' },
      });
      expect(result).toMatchObject({
        id: 's1',
        email: 'store@example.com',
        owner_id: null,
      });
    });

    it('accepts a valid store_owner as owner', async () => {
      const now = new Date();
      storeRepo.findOne.mockResolvedValue(null);
      usersService.findById.mockResolvedValue({
        id: 'owner-1',
        role: Role.STORE_OWNER,
      } as User);
      storeRepo.create.mockImplementation((s) => s as Store);
      storeRepo.save.mockResolvedValue({
        id: 's2',
        name: base.name,
        email: 'store@example.com',
        address: base.address,
        createdAt: now,
      } as Store);

      const result = await service.createStore({
        ...base,
        owner_id: 'owner-1',
      });
      expect(result.owner_id).toBe('owner-1');
    });
  });
});
