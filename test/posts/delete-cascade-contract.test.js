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

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lumi_posts_delete_contract');
  process.env.JWT_SECRET = 'test-secret-delete-contract';
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

  agent = request.agent(app);
  await agent
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ username: 'admin', password: 'admin@123' })
    .expect(200);

  const uploadsDir = path.resolve(__dirname, '../../public/uploads');
  const outputDir = path.resolve(__dirname, '../../public/output');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  // Create one asset with existing generated file and missing original file (ENOENT tolerated)
  const generatedPath1 = path.join(outputDir, `delete-test-generated-${Date.now()}.png`);
  fs.writeFileSync(generatedPath1, 'generated-content');
  await PostAsset.create({
    userId: user._id,
    postType: 'BA',
    title: 'Delete ENOENT Case',
    content: 'case 1',
    caption: 'caption',
    originalFilePath: path.join(uploadsDir, `missing-original-${Date.now()}.png`),
    originalFilename: 'missing-original.png',
    generatedFilePath: generatedPath1,
    generatedFilename: path.basename(generatedPath1),
    generationStatus: 'success',
  });

  // Create one asset with original path pointing to a directory (fs error expected)
  const generatedPath2 = path.join(outputDir, `delete-test-generated-err-${Date.now()}.png`);
  fs.writeFileSync(generatedPath2, 'generated-content-2');
  await PostAsset.create({
    userId: user._id,
    postType: 'BA',
    title: 'Delete FS Error Case',
    content: 'case 2',
    caption: 'caption',
    originalFilePath: uploadsDir,
    originalFilename: 'uploads-dir-as-file',
    generatedFilePath: generatedPath2,
    generatedFilename: path.basename(generatedPath2),
    generationStatus: 'success',
  });
});

test.after(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongod) await mongod.stop();
});

test('DELETE /api/posts/:id tolerates ENOENT and removes DB record', async () => {
  const post = await PostAsset.findOne({ title: 'Delete ENOENT Case' });
  assert.ok(post);

  const response = await agent
    .delete(`/api/posts/${post._id}`)
    .set('Accept', 'application/json')
    .expect(200);

  assert.equal(response.body.success, true);

  const deleted = await PostAsset.findById(post._id);
  assert.equal(deleted, null);
});

test('DELETE /api/posts/:id keeps DB record on non-ENOENT fs error', async () => {
  const post = await PostAsset.findOne({ title: 'Delete FS Error Case' });
  assert.ok(post);

  const response = await agent
    .delete(`/api/posts/${post._id}`)
    .set('Accept', 'application/json')
    .expect(500);

  assert.equal(response.body.success, false);

  const stillExists = await PostAsset.findById(post._id);
  assert.ok(stillExists, 'record must be preserved on FS error');
});
