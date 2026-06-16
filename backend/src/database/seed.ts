import * as bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { Role } from '../common/enums/role.enum';
import AppDataSource from '../config/data-source';
import { Rating } from '../ratings/entities/rating.entity';
import { Store } from '../stores/entities/store.entity';
import { User } from '../users/entities/user.entity';

/**
 * Seeds a fully-populated demo dataset so the app is explorable on first run:
 *   - 1 System Administrator
 *   - 3 store owners, each linked to a store
 *   - 9 additional unowned stores (12 stores total → pagination is meaningful)
 *   - 5 normal users
 *   - randomised 1-5 ratings (every normal user rates at least 3 stores)
 *
 * Idempotent at the row level: every user is matched by email, every store by
 * email, and every rating by its (user, store) pair, so re-running only fills
 * in what is missing and never duplicates or throws on the unique constraints.
 *
 * Defaults (overridable via ADMIN_* env vars):
 *   name:     System Administrator
 *   email:    admin@example.com
 *   password: Admin@123
 *
 * Run after migrations:  npm run migration:run && npm run seed
 */

/** Shared password for every demo account (8-16 chars, 1 upper + 1 special). */
const DEMO_PASSWORD = 'Password@1';

interface OwnerSeed {
  name: string;
  email: string;
  address: string;
  store: { name: string; email: string; address: string };
}

// Owner display names are 20-60 chars to satisfy the app's name validation.
const OWNERS: OwnerSeed[] = [
  {
    name: 'Olivia Margaret Bennett',
    email: 'olivia.bennett@example.com',
    address: '12 Harbour View Road, Brighton, BN1 3AA',
    store: {
      name: 'Bennett Hardware & Supplies',
      email: 'contact@bennetthardware.example.com',
      address: '12 Harbour View Road, Brighton, BN1 3AA',
    },
  },
  {
    name: 'Rajesh Kumar Sharma Gupta',
    email: 'rajesh.sharma@example.com',
    address: '88 Maple Crescent, Leicester, LE2 7TY',
    store: {
      name: 'Sharma Electronics Mart',
      email: 'sales@sharmaelectronics.example.com',
      address: '88 Maple Crescent, Leicester, LE2 7TY',
    },
  },
  {
    name: 'Daniel Christopher Walker',
    email: 'daniel.walker@example.com',
    address: '5 Old Mill Lane, Sheffield, S11 8ZB',
    store: {
      name: 'Walker Coffee Roasters',
      email: 'hello@walkercoffee.example.com',
      address: '5 Old Mill Lane, Sheffield, S11 8ZB',
    },
  },
];

// Stores with no linked owner account — they still collect ratings.
const UNOWNED_STORES: { name: string; email: string; address: string }[] = [
  {
    name: 'Greenfield Organic Grocers',
    email: 'shop@greenfieldgrocers.example.com',
    address: '210 Park Avenue, Bristol, BS8 1QU',
  },
  {
    name: 'The Corner Bookshop',
    email: 'books@cornerbookshop.example.com',
    address: '3 Castle Street, York, YO1 9RN',
  },
  {
    name: 'Sunrise Bakery & Patisserie',
    email: 'orders@sunrisebakery.example.com',
    address: '47 Queen Street, Bath, BA1 1HE',
  },
  {
    name: 'Pinnacle Sports Outlet',
    email: 'info@pinnaclesports.example.com',
    address: '19 Trinity Road, Nottingham, NG1 4AB',
  },
  {
    name: 'Lakeside Garden Centre',
    email: 'enquiries@lakesidegarden.example.com',
    address: 'Mill Road, Cambridge, CB1 2AZ',
  },
  {
    name: 'Metro Pharmacy & Wellness',
    email: 'care@metropharmacy.example.com',
    address: '102 High Street, Manchester, M1 1AD',
  },
  {
    name: 'Artisan Cheese & Deli',
    email: 'shop@artisandeli.example.com',
    address: '8 Market Place, Oxford, OX1 3DP',
  },
  {
    name: 'Riverside Electronics Hub',
    email: 'support@riversideelectronics.example.com',
    address: '64 Dock Street, Liverpool, L1 8JQ',
  },
  {
    name: 'Cosy Home Furnishings',
    email: 'sales@cosyhomefurnishings.example.com',
    address: '23 Elm Grove, Cardiff, CF10 2EH',
  },
];

// Normal-user display names are 20-60 chars.
const NORMAL_USERS: { name: string; email: string; address: string }[] = [
  {
    name: 'William Alexander Turner',
    email: 'william.turner@example.com',
    address: '14 Birch Close, Reading, RG1 5HT',
  },
  {
    name: 'Sophia Isabella Martinez',
    email: 'sophia.martinez@example.com',
    address: '77 Cedar Avenue, Glasgow, G12 8QQ',
  },
  {
    name: 'Benjamin Harrison Clark',
    email: 'benjamin.clark@example.com',
    address: '9 Willow Bank, Newcastle, NE1 7RU',
  },
  {
    name: 'Charlotte Grace Thompson',
    email: 'charlotte.thompson@example.com',
    address: '31 Oakfield Road, Plymouth, PL4 6AB',
  },
  {
    name: 'Mohammed Abdullah Khan Ali',
    email: 'mohammed.khan@example.com',
    address: '56 Rosewood Street, Bradford, BD1 2LP',
  },
];

/** Find a user by email or create it; returns the persisted entity. */
async function ensureUser(
  repo: Repository<User>,
  data: { name: string; email: string; address: string | null; role: Role },
  passwordHash: string,
): Promise<User> {
  const email = data.email.toLowerCase().trim();
  const existing = await repo.findOne({ where: { email } });
  if (existing) return existing;
  return repo.save(
    repo.create({
      name: data.name,
      email,
      password: passwordHash,
      address: data.address,
      role: data.role,
    }),
  );
}

/** Find a store by email or create it (optionally linked to an owner). */
async function ensureStore(
  repo: Repository<Store>,
  data: { name: string; email: string; address: string },
  owner: User | null,
): Promise<Store> {
  const email = data.email.toLowerCase().trim();
  const existing = await repo.findOne({ where: { email } });
  if (existing) return existing;
  return repo.save(
    repo.create({
      name: data.name,
      email,
      address: data.address,
      owner,
    }),
  );
}

/** Create a rating for (user, store) unless one already exists. */
async function ensureRating(
  repo: Repository<Rating>,
  user: User,
  store: Store,
  value: number,
): Promise<void> {
  const existing = await repo.findOne({
    where: { user: { id: user.id }, store: { id: store.id } },
  });
  if (existing) return;
  await repo.save(repo.create({ user, store, value }));
}

async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const stores = dataSource.getRepository(Store);
    const ratings = dataSource.getRepository(Rating);

    const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

    // 1. Default administrator.
    const adminName = process.env.ADMIN_NAME ?? 'System Administrator';
    const adminEmail = (process.env.ADMIN_EMAIL ?? 'admin@example.com').toLowerCase().trim();
    const adminPassword = process.env.ADMIN_PASSWORD ?? 'Admin@123';
    await ensureUser(
      users,
      { name: adminName, email: adminEmail, address: null, role: Role.ADMIN },
      await bcrypt.hash(adminPassword, 10),
    );

    // 2. Store owners + their stores.
    const allStores: Store[] = [];
    for (const o of OWNERS) {
      const owner = await ensureUser(
        users,
        { name: o.name, email: o.email, address: o.address, role: Role.STORE_OWNER },
        passwordHash,
      );
      allStores.push(await ensureStore(stores, o.store, owner));
    }

    // 3. Additional unowned stores.
    for (const s of UNOWNED_STORES) {
      allStores.push(await ensureStore(stores, s, null));
    }

    // 4. Normal users.
    const normals: User[] = [];
    for (const u of NORMAL_USERS) {
      normals.push(
        await ensureUser(
          users,
          { name: u.name, email: u.email, address: u.address, role: Role.NORMAL },
          passwordHash,
        ),
      );
    }

    // 5. Ratings: each normal user rates a random subset (>= 3) of the stores.
    let ratingCount = 0;
    for (const user of normals) {
      const shuffled = [...allStores].sort(() => Math.random() - 0.5);
      const count = 3 + Math.floor(Math.random() * 5); // 3..7 stores
      for (const store of shuffled.slice(0, count)) {
        const value = 1 + Math.floor(Math.random() * 5); // 1..5
        await ensureRating(ratings, user, store, value);
        ratingCount += 1;
      }
    }

    console.log('[seed] Demo data ready:');
    console.log(`       admin:        ${adminEmail} / ${adminPassword}`);
    console.log(`       store owners: ${OWNERS.length} (password: ${DEMO_PASSWORD})`);
    console.log(`       normal users: ${NORMAL_USERS.length} (password: ${DEMO_PASSWORD})`);
    console.log(`       stores:       ${allStores.length}`);
    console.log(`       ratings:      up to ${ratingCount} (existing rows preserved)`);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
