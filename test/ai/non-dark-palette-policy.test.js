const test = require('node:test');
const assert = require('node:assert/strict');

const templates = [
  require('../../src/templates/beforeAfter.template'),
  require('../../src/templates/review.template'),
  require('../../src/templates/bts.template'),
  require('../../src/templates/promotion.template'),
  require('../../src/templates/spotlight.template'),
];

test('prompts enforce adaptive palette and not always-dark style', () => {
  templates.forEach((template) => {
    const prompt = template.buildImagePrompt({ title: 'Palette test' });
    assert.match(prompt, /derive the primary palette from the uploaded product photo/i);
    assert.match(prompt, /do not force an always-dark style/i);
  });
});
