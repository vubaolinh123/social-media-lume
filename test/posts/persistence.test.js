const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');
const fs = require('fs');
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

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lumi_posts_persistence');
  process.env.JWT_SECRET = 'test-secret-posts-persistence';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_COOKIE_NAME = 'lumi_token';
  process.env.GEMINI_API_KEY = '';

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
  await User.findOneAndUpdate(
    { username: 'admin' },
    { $set: { username: 'admin', passwordHash, role: 'admin' } },
    { upsert: true, new: true }
  );

  const basePublic = path.resolve(__dirname, '../../public');
  ensureDir(path.join(basePublic, 'uploads'));
  ensureDir(path.join(basePublic, 'output'));

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

test('POST /create persists PostAsset in MongoDB', async () => {
  const imagePath = path.resolve(__dirname, '../../public/assets/logo.png');

  const response = await agent
    .post('/create')
    .field('title', 'Persistence Test')
    .field('content', 'Nội dung test lưu DB')
    .field('postType', 'BA')
    .attach('media', imagePath)
    .expect(200);

  assert.match(response.text, /Xem Trước Bài Viết/);

  const post = await PostAsset.findOne({ title: 'Persistence Test' }).sort({ createdAt: -1 });
  assert.ok(post, 'post asset should be saved');
  assert.equal(post.postType, 'BA');
  assert.ok(post.originalFilePath);
  assert.ok(post.originalFilename);
  assert.equal(['processing', 'success', 'failed'].includes(post.generationStatus), true);
});

test('POST /create persists and can stay in processing before async completion', async () => {
  const imagePath = path.resolve(__dirname, '../../public/assets/logo.png');

  const response = await agent
    .post('/create')
    .field('title', 'Persistence Similarity Failed')
    .field('content', 'Nội dung test similarity failed vẫn lưu')
    .field('postType', 'BA')
    .attach('media', imagePath)
    .expect(200);

  assert.match(response.text, /Xem Trước Bài Viết/);

  const post = await PostAsset.findOne({ title: 'Persistence Similarity Failed' }).sort({ createdAt: -1 });
  assert.ok(post, 'post asset should be saved');
  assert.ok(['processing', 'success', 'failed'].includes(post.generationStatus));
});
