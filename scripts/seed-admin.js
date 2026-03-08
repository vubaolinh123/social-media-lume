const { connectMongo, disconnectMongo } = require('../src/config/db');
const User = require('../src/models/user.model');
const { hashPassword, normalizeUsername } = require('../src/services/auth.service');

async function seedAdmin() {
  await connectMongo();

  const username = normalizeUsername('admin');
  const passwordHash = await hashPassword('admin@123');

  const result = await User.findOneAndUpdate(
    { username },
    {
      $set: {
        username,
        passwordHash,
        role: 'admin',
      },
    },
    {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    }
  );

  if (!result) {
    throw new Error('Failed to seed admin account');
  }

  console.log('admin seeded');
}

seedAdmin()
  .catch((error) => {
    console.error('seed failed:', error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectMongo();
  });
