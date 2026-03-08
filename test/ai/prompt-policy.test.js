const test = require('node:test');
const assert = require('node:assert/strict');

const ba = require('../../src/templates/beforeAfter.template');
const review = require('../../src/templates/review.template');
const bts = require('../../src/templates/bts.template');
const promo = require('../../src/templates/promotion.template');
const spotlight = require('../../src/templates/spotlight.template');
const tutorial = require('../../src/templates/tutorial.template');
const newArrival = require('../../src/templates/newArrival.template');
const seasonal = require('../../src/templates/seasonal.template');
const tips = require('../../src/templates/tips.template');
const portfolio = require('../../src/templates/portfolio.template');
const aiRandom = require('../../src/templates/aiRandom.template');

const templates = [ba, review, bts, promo, spotlight, tutorial, newArrival, seasonal, tips, portfolio, aiRandom];

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

test('all image prompts enforce English-only text in generated images', () => {
  templates.forEach((template) => {
    const prompt = template.buildImagePrompt({ title: 'Khuyến mãi cuối tuần', content: 'Nối mi siêu đẹp' });

    assert.match(prompt, /all text rendered in the generated image must be in english/i);
    assert.match(prompt, /translate it to natural marketing english/i);
    assert.match(prompt, /do not render vietnamese words or vietnamese diacritics/i);
  });
});

test('ai random template includes full creative-freedom instructions', () => {
  const prompt = aiRandom.buildImagePrompt({ title: 'Creative direction test' });

  assert.match(prompt, /full creative freedom/i);
  assert.match(prompt, /possible styles/i);
  assert.match(prompt, /analyze the uploaded image deeply/i);
});
