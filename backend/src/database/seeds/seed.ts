import * as bcrypt from 'bcrypt';
import { Role } from '../../common/enums/role.enum';
import AppDataSource from '../../config/data-source';
import { User } from '../../users/entities/user.entity';

/**
 * Seeds a single default System Administrator. Idempotent: if an admin with the
 * configured email already exists, it does nothing. Run after migrations:
 *   npm run migration:run && npm run seed
 */
async function seed(): Promise<void> {
  const dataSource = await AppDataSource.initialize();
  try {
    const userRepository = dataSource.getRepository(User);

    const email = (process.env.ADMIN_EMAIL ?? 'admin@platform.com')
      .toLowerCase()
      .trim();
    const existing = await userRepository.findOne({ where: { email } });
    if (existing) {
      console.log(`[seed] Admin already exists (${email}); nothing to do.`);
      return;
    }

    const name = process.env.ADMIN_NAME ?? 'System Default Administrator';
    const password = process.env.ADMIN_PASSWORD ?? 'Admin@1234';

    const admin = userRepository.create({
      name,
      email,
      password: await bcrypt.hash(password, 10),
      address: null,
      role: Role.ADMIN,
    });
    await userRepository.save(admin);

    console.log(`[seed] Created admin user:`);
    console.log(`       email:    ${email}`);
    console.log(`       password: ${password}`);
  } finally {
    await AppDataSource.destroy();
  }
}

seed().catch((err) => {
  console.error('[seed] Failed:', err);
  process.exit(1);
});
