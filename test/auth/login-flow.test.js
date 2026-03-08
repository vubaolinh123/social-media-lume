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
let authService;
let config;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lumi_auth_login_flow');
  process.env.JWT_SECRET = 'test-secret-login-flow';
  process.env.JWT_EXPIRES_IN = '1h';
  process.env.JWT_COOKIE_NAME = 'lumi_token';

  clearRequireCache('../../src/config');
  clearRequireCache('../../src/config/db');
  clearRequireCache('../../src/models/user.model');
  clearRequireCache('../../src/services/auth.service');
  clearRequireCache('../../server');

  app = require('../../server');
  ({ connectMongo, disconnectMongo } = require('../../src/config/db'));
  User = require('../../src/models/user.model');
  authService = require('../../src/services/auth.service');
  config = require('../../src/config');

  await connectMongo();

  const passwordHash = await authService.hashPassword('admin@123');
  await User.create({
    username: 'admin',
    passwordHash,
    role: 'admin',
  });
});

test.after(async () => {
  if (disconnectMongo) {
    await disconnectMongo();
  }
  if (mongod) {
    await mongod.stop();
  }
});

test('POST /auth/login returns 401 for wrong credentials', async () => {
  const response = await request(app)
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ username: 'admin', password: 'wrong-password' });

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});

test('POST /auth/login returns JWT + cookie for valid credentials', async () => {
  const response = await request(app)
    .post('/auth/login')
    .set('Accept', 'application/json')
    .send({ username: 'admin', password: 'admin@123' });

  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(typeof response.body.token, 'string');
  assert.equal(response.body.user.username, 'admin');

  const setCookie = response.headers['set-cookie'] || [];
  const cookieName = `${config.auth.jwtCookieName}=`;
  assert.ok(setCookie.some((cookie) => cookie.startsWith(cookieName)));
});
