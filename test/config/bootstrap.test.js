const test = require('node:test');
const assert = require('node:assert');

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-bootstrap-secret';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumi_bootstrap_test';

test('config exposes mongo and auth settings', () => {
  const config = require('../../src/config');

  assert.ok(config.mongo);
  assert.ok(config.mongo.uri);
  assert.ok(config.auth);
  assert.ok(config.auth.jwtSecret);
  assert.ok(config.auth.jwtExpiresIn);
  assert.ok(config.auth.jwtCookieName);
});

test('server can be imported without auto-listen side effects', () => {
  try {
    delete require.cache[require.resolve('../../server')];
  } catch (error) {
    // ignore
  }
  const app = require('../../server');
  assert.ok(app);
  assert.strictEqual(typeof app.use, 'function');
});
