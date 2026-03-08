const test = require('node:test');
const assert = require('node:assert/strict');
const request = require('supertest');
const { MongoMemoryServer } = require('mongodb-memory-server');

const facebookService = require('../../src/services/facebook.service');
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
  process.env.MONGODB_URI = mongod.getUri('lumi_gallery_publish_fb');
  process.env.JWT_SECRET = 'test-secret-gallery-publish-fb';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_COOKIE_NAME = 'lumi_token';
  process.env.FACEBOOK_PAGE_ACCESS_TOKEN = 'fake-token-for-tests';

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
    title: 'Publish FB Item',
    caption: 'Caption',
    originalFilePath: 'public/uploads/fb-original.png',
    originalFilename: 'fb-original.png',
    generatedFilePath: 'public/output/fb-generated.png',
    generatedFilename: 'fb-generated.png',
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

test('POST /api/posts/:id/publish/facebook updates publish status', async (t) => {
  const originalPostToPage = facebookService.postToPage;
  const originalPostVideoToPage = facebookService.postVideoToPage;

  facebookService.postToPage = async () => ({ success: true, postId: 'fb-post-123' });
  facebookService.postVideoToPage = async () => ({ success: true, postId: 'fb-video-123' });

  t.after(() => {
    facebookService.postToPage = originalPostToPage;
    facebookService.postVideoToPage = originalPostVideoToPage;
  });

  const response = await agent
    .post(`/api/posts/${postId}/publish/facebook`)
    .set('Accept', 'application/json')
    .expect(200);

  assert.equal(response.body.success, true);
  assert.equal(response.body.publishStatus.facebook.success, true);
  assert.equal(response.body.publishStatus.facebook.postId, 'fb-post-123');
});
