const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');

const geminiService = require('../../src/services/gemini.service');
const similarityService = require('../../src/services/similarity.service');

const sourceImage = path.resolve(__dirname, '../../public/assets/logo.png');

test('generateImage creates one image attempt and returns immediately', async (t) => {
  const originalEvaluate = similarityService.evaluateProductSimilarity;
  const originalInit = geminiService.init;

  similarityService.evaluateProductSimilarity = async () => ({ success: true, score: 82, reason: 'noop' });

  geminiService.init = () => true;

  const fakeBuffer = fs.readFileSync(sourceImage);
  const fakeModel = {
    generateContent: async () => ({
      response: {
        candidates: [{
          content: {
            parts: [
              { inlineData: { data: fakeBuffer.toString('base64'), mimeType: 'image/png' } },
            ],
          },
        }],
      },
    }),
  };

  const fakeGenAI = {
    getGenerativeModel: () => fakeModel,
  };

  geminiService.__setTestClient?.(fakeGenAI, fakeModel, fakeModel);

  const result = await geminiService.generateImage(sourceImage, 'BA', { title: 'Retry test' }, {});

  assert.equal(result.success, true);
  assert.equal(result.generationAttempts, 1);
  assert.equal(result.generationStatus, 'success');

  similarityService.evaluateProductSimilarity = originalEvaluate;
  geminiService.init = originalInit;
  geminiService.__resetTestClient?.();

  t.after(() => {
    similarityService.evaluateProductSimilarity = originalEvaluate;
    geminiService.init = originalInit;
    geminiService.__resetTestClient?.();
  });
});
