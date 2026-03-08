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

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri('lumi_auth_guard');
  process.env.JWT_SECRET = 'test-secret-guard';
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

  await connectMongo();
  const passwordHash = await authService.hashPassword('admin@123');
  await User.create({ username: 'admin', passwordHash, role: 'admin' });
});

test.after(async () => {
  if (disconnectMongo) await disconnectMongo();
  if (mongod) await mongod.stop();
});

test('GET / redirects to /login without token', async () => {
  const response = await request(app)
    .get('/')
    .set('Accept', 'text/html');

  assert.equal(response.status, 302);
  assert.equal(response.headers.location, '/login');
});

test('GET /api/status returns 401 json without token', async () => {
  const response = await request(app)
    .get('/api/status')
    .set('Accept', 'application/json');

  assert.equal(response.status, 401);
  assert.equal(response.body.success, false);
});
