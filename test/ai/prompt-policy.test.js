const test = require('node:test');
const assert = require('node:assert/strict');

const ba = require('../../src/templates/beforeAfter.template');
const review = require('../../src/templates/review.template');
const bts = require('../../src/templates/bts.template');
const promo = require('../../src/templates/promotion.template');
const spotlight = require('../../src/templates/spotlight.template');

const templates = [ba, review, bts, promo, spotlight];

test('all image prompts include product identity invariants', () => {
  templates.forEach((template) => {
    const prompt = template.buildImagePrompt({ title: 'Test', serviceName: 'Service' });

    assert.match(prompt, /same uploaded product identity/i);
    assert.match(prompt, /do not invent, replace, or redesign the product/i);
    assert.match(prompt, /single source of truth/i);
    assert.match(prompt, /footer contact block/i);
    assert.match(prompt, /footer must include exact text/i);
    assert.match(prompt, /footer must appear exactly once/i);
  });
});

test('prompts can disable footer contact block when toggle is off', () => {
  templates.forEach((template) => {
    const prompt = template.buildImagePrompt({ title: 'Test', includeFooterContact: false });
    assert.match(prompt, /do not include address, phone, hotline/i);
  });
});
