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
let postId;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lumi_gallery_delete_item');
  process.env.JWT_SECRET = 'test-secret-gallery-delete';
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

  const uploadsDir = path.resolve(__dirname, '../../public/uploads');
  const outputDir = path.resolve(__dirname, '../../public/output');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const originalPath = path.join(uploadsDir, `gallery-delete-original-${Date.now()}.png`);
  const generatedPath = path.join(outputDir, `gallery-delete-generated-${Date.now()}.png`);
  fs.writeFileSync(originalPath, 'original-content');
  fs.writeFileSync(generatedPath, 'generated-content');

  const post = await PostAsset.create({
    userId: user._id,
    postType: 'Promo',
    title: 'Delete Gallery Item',
    caption: 'Caption',
    originalFilePath: originalPath,
    originalFilename: path.basename(originalPath),
    generatedFilePath: generatedPath,
    generatedFilename: path.basename(generatedPath),
    generationStatus: 'success',
  });
  postId = String(post._id);

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

test('DELETE /api/posts/:id removes both files and db record', async () => {
  const postBefore = await PostAsset.findById(postId);
  assert.ok(postBefore);
  assert.equal(fs.existsSync(postBefore.originalFilePath), true);
  assert.equal(fs.existsSync(postBefore.generatedFilePath), true);

  const response = await agent
    .delete(`/api/posts/${postId}`)
    .set('Accept', 'application/json')
    .expect(200);

  assert.equal(response.body.success, true);

  const postAfter = await PostAsset.findById(postId);
  assert.equal(postAfter, null);
  assert.equal(fs.existsSync(postBefore.originalFilePath), false);
  assert.equal(fs.existsSync(postBefore.generatedFilePath), false);
});
