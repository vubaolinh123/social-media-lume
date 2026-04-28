const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const instagramService = require('../../src/services/instagram.service');
const { encryptText } = require('../../src/utils/crypto');

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
  process.env.MONGODB_URI = mongod.getUri('lumi_gallery_publish_ig');
  process.env.JWT_SECRET = 'test-secret-gallery-publish-ig';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_COOKIE_NAME = 'lumi_token';
  process.env.BLOTATO_API_KEY = 'blt_test-fake-key';
  process.env.BLOTATO_FB_ACCOUNT_ID = '28121';
  process.env.BLOTATO_IG_ACCOUNT_ID = '44007';

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
    {
      $set: {
        username: 'admin',
        passwordHash,
        role: 'admin',
        settings: {
          social: {
            facebookPageAccessToken: encryptText('fake-token-for-tests'),
          },
        },
      },
    },
    { upsert: true, new: true }
  );

  const post = await PostAsset.create({
    userId: user._id,
    postType: 'BA',
    title: 'Publish IG Item',
    caption: 'Caption',
    originalFilePath: 'public/uploads/ig-original.png',
    originalFilename: 'ig-original.png',
    generatedFilePath: 'public/output/ig-generated.png',
    generatedFilename: 'ig-generated.png',
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

test('POST /api/posts/:id/publish/instagram posts directly via Blotato', async (t) => {
  const originalIg = instagramService.postToInstagram;

  instagramService.postToInstagram = async (imageUrlOrPath) => {
    assert.ok(imageUrlOrPath, 'imageUrlOrPath should be provided');
    return { success: true, postId: 'ig-post-001' };
  };

  t.after(() => {
    instagramService.postToInstagram = originalIg;
  });

  const response = await agent
    .post(`/api/posts/${postId}/publish/instagram`)
    .set('Accept', 'application/json')
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.publishStatus.instagram.success, true);
});
