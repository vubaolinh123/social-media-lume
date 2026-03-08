const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

function clearRequireCache(modulePath) {
  try {
    delete require.cache[require.resolve(modulePath)];
  } catch (error) {
    // ignore
  }
}

let mongod;
let app;
let connectMongo;
let disconnectMongo;
let User;
let PostAsset;
let authService;
let agent;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lumi_gallery_buttons');
  process.env.JWT_SECRET = 'test-secret-gallery-buttons';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_COOKIE_NAME = 'lumi_token';

  clearRequireCache('../../src/config');
  clearRequireCache('../../src/config/db');
  clearRequireCache('../../src/models/user.model');
  clearRequireCache('../../src/models/post-asset.model');
  clearRequireCache('../../src/services/auth.service');
  clearRequireCache('../../server');

  app = require('../../server');
  ({ connectMongo, disconnectMongo } = require('../../src/config/db'));
  User = require('../../src/models/user.model');
  PostAsset = require('../../src/models/post-asset.model');
  authService = require('../../src/services/auth.service');

  await connectMongo();
  const passwordHash = await authService.hashPassword('admin@123');
  const user = await User.findOneAndUpdate(
    { username: 'admin' },
    { $set: { username: 'admin', passwordHash, role: 'admin' } },
    { upsert: true, new: true }
  );

  await PostAsset.create({
    userId: user._id,
    postType: 'Review',
    title: 'Buttons Item',
    caption: 'Caption',
    originalFilePath: 'public/uploads/buttons-original.png',
    originalFilename: 'buttons-original.png',
    generatedFilePath: 'public/output/buttons-generated.png',
    generatedFilename: 'buttons-generated.png',
    generationStatus: 'success',
  });

  agent = request.agent(app);
  await agent
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ username: 'admin', password: 'admin@123' })
    .expect(200);
});

test.after(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongod) await mongod.stop();
});

test('gallery item has Facebook, Instagram, and Delete buttons', async () => {
  const response = await agent.get('/gallery').set('Accept', 'text/html').expect(200);

  assert.match(response.text, /Đăng Facebook/);
  assert.match(response.text, /Đăng Instagram/);
  assert.match(response.text, /Xóa ảnh/);
});
