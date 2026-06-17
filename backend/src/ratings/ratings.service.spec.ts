import {
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { QueryFailedError, Repository } from 'typeorm';
import { Store } from '../stores/entities/store.entity';
import { Rating } from './entities/rating.entity';
import { RatingsService } from './ratings.service';

/** Chainable query-builder stub whose terminal methods resolve to fixtures. */
function qbMock(results: {
  getOne?: unknown;
  getRawOne?: unknown;
  getRawMany?: unknown[];
}) {
  const qb: Record<string, jest.Mock> = {};
  for (const m of [
    'select',
    'addSelect',
    'where',
    'andWhere',
    'innerJoin',
    'leftJoin',
    'orderBy',
    'limit',
  ]) {
    qb[m] = jest.fn(() => qb);
  }
  qb.getOne = jest.fn().mockResolvedValue(results.getOne ?? null);
  qb.getRawOne = jest.fn().mockResolvedValue(results.getRawOne ?? null);
  qb.getRawMany = jest.fn().mockResolvedValue(results.getRawMany ?? []);
  return qb;
}

describe('RatingsService', () => {
  let service: RatingsService;
  let ratingRepo: jest.Mocked<Repository<Rating>>;
  let storeRepo: jest.Mocked<Repository<Store>>;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        RatingsService,
        {
          provide: getRepositoryToken(Rating),
          useValue: {
            createQueryBuilder: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Store),
          useValue: { findOne: jest.fn(), createQueryBuilder: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get(RatingsService);
    ratingRepo = moduleRef.get(getRepositoryToken(Rating));
    storeRepo = moduleRef.get(getRepositoryToken(Store));
  });

  describe('create', () => {
    const dto = { store_id: 'store-1', value: 4 };

    it('throws NotFound when the store does not exist', async () => {
      storeRepo.findOne.mockResolvedValue(null);
      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('throws Conflict when the user already rated the store (fast path)', async () => {
      storeRepo.findOne.mockResolvedValue({ id: 'store-1' } as Store);
      ratingRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: { id: 'existing' } }) as never,
      );
      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('persists and maps the view on success', async () => {
      const now = new Date();
      storeRepo.findOne.mockResolvedValue({ id: 'store-1' } as Store);
      ratingRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: null }) as never,
      );
      ratingRepo.create.mockReturnValue({ value: 4 } as Rating);
      ratingRepo.save.mockResolvedValue({
        id: 'rating-1',
        value: 4,
        createdAt: now,
        updatedAt: now,
      } as Rating);

      const view = await service.create('user-1', dto);

      expect(view).toEqual({
        id: 'rating-1',
        store_id: 'store-1',
        user_id: 'user-1',
        value: 4,
        created_at: now,
        updated_at: now,
      });
    });

    it('maps a unique-violation race (23505) to Conflict', async () => {
      storeRepo.findOne.mockResolvedValue({ id: 'store-1' } as Store);
      ratingRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: null }) as never,
      );
      ratingRepo.create.mockReturnValue({ value: 4 } as Rating);
      ratingRepo.save.mockRejectedValue(
        new QueryFailedError('insert', [], {
          code: '23505',
        } as unknown as Error),
      );

      await expect(service.create('user-1', dto)).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('re-throws unexpected database errors', async () => {
      storeRepo.findOne.mockResolvedValue({ id: 'store-1' } as Store);
      ratingRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getOne: null }) as never,
      );
      ratingRepo.create.mockReturnValue({ value: 4 } as Rating);
      ratingRepo.save.mockRejectedValue(new Error('connection lost'));

      await expect(service.create('user-1', dto)).rejects.toThrow(
        'connection lost',
      );
    });
  });

  describe('update', () => {
    it('throws NotFound when the rating does not exist', async () => {
      ratingRepo.findOne.mockResolvedValue(null);
      await expect(
        service.update('user-1', 'rating-1', { value: 3 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it("throws Forbidden when updating someone else's rating", async () => {
      ratingRepo.findOne.mockResolvedValue({
        id: 'rating-1',
        value: 2,
        user: { id: 'other-user' },
        store: { id: 'store-1' },
      } as Rating);

      await expect(
        service.update('user-1', 'rating-1', { value: 3 }),
      ).rejects.toBeInstanceOf(ForbiddenException);
    });

    it('updates the value for the owning user', async () => {
      const now = new Date();
      ratingRepo.findOne.mockResolvedValue({
        id: 'rating-1',
        value: 2,
        user: { id: 'user-1' },
        store: { id: 'store-1' },
      } as Rating);
      ratingRepo.save.mockResolvedValue({
        id: 'rating-1',
        value: 5,
        createdAt: now,
        updatedAt: now,
      } as Rating);

      const view = await service.update('user-1', 'rating-1', { value: 5 });
      expect(view.value).toBe(5);
      expect(view.store_id).toBe('store-1');
    });
  });

  describe('getOwnerDashboard', () => {
    it('returns empty defaults when the owner has no stores', async () => {
      storeRepo.createQueryBuilder.mockReturnValue(
        qbMock({ getRawMany: [] }) as never,
      );

      const result = await service.getOwnerDashboard('owner-1');
      expect(result).toEqual({ avg_rating: null, raters: [] });
    });
  });
});
