const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const config = require('../config');

let scorerAI = null;
let scorerModel = null;

function initScorer() {
  if (!config.gemini.apiKey) return false;
  if (scorerModel) return true;

  scorerAI = new GoogleGenerativeAI(config.gemini.apiKey);
  scorerModel = scorerAI.getGenerativeModel({ model: config.gemini.textModel });
  return true;
}

function fileToPart(filePath) {
  const resolved = path.resolve(filePath);
  const imageData = fs.readFileSync(resolved);
  const base64Data = imageData.toString('base64');
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
  };

  return {
    inlineData: {
      mimeType: mimeTypes[ext] || 'image/png',
      data: base64Data,
    },
  };
}

function bufferToPart(buffer, mimeType = 'image/png') {
  return {
    inlineData: {
      mimeType,
      data: buffer.toString('base64'),
    },
  };
}

function parseScore(text) {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const payload = JSON.parse(jsonMatch[0]);
    const score = Number(payload.score);
    if (Number.isNaN(score)) return null;

    return {
      score: Math.max(0, Math.min(100, score)),
      reason: payload.reason || '',
    };
  } catch (error) {
    return null;
  }
}

async function evaluateProductSimilarity(sourceImagePath, generatedImageBuffer, mimeType = 'image/png') {
  if (!initScorer()) {
    return {
      success: false,
      score: 0,
      reason: 'Gemini scorer unavailable',
      raw: '',
    };
  }

  try {
    const prompt = `You are a strict visual QA evaluator.
Compare SOURCE product image and GENERATED design image.
Return JSON only with:
{
  "score": <0-100 number>,
  "reason": "short reason"
}

Scoring criteria:
- Product identity match (shape, packaging, label/logo, material): 70%
- Color/material consistency with source: 20%
- No product substitution/invention: 10%

If generated image invents a different product, score must be < 90.`;

    const response = await scorerModel.generateContent([
      prompt,
      fileToPart(sourceImagePath),
      bufferToPart(generatedImageBuffer, mimeType),
    ]);

    const text = response.response.text();
    const parsed = parseScore(text);

    if (!parsed) {
      return {
        success: false,
        score: 0,
        reason: 'Unable to parse similarity response',
        raw: text,
      };
    }

    return {
      success: true,
      score: parsed.score,
      reason: parsed.reason,
      raw: text,
    };
  } catch (error) {
    return {
      success: false,
      score: 0,
      reason: error.message,
      raw: '',
    };
  }
}

module.exports = {
  evaluateProductSimilarity,
};
