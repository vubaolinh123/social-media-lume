/**
 * Gemini AI Service
 * Handles:
 *  - Image generation: Gemini nhận ảnh gốc + prompt → tạo ra ảnh thiết kế hoàn chỉnh
 *  - Caption generation: Gemini tạo caption/hashtags cho bài đăng
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');
const config = require('../config');
const { buildRetryReinforcement } = require('../templates/image/prompt.shared');

// Template prompt modules (new: mỗi template chứa prompt cho cả image gen và caption gen)
const baTemplate = require('../templates/beforeAfter.template');
const reviewTemplate = require('../templates/review.template');
const btsTemplate = require('../templates/bts.template');
const promoTemplate = require('../templates/promotion.template');
const spotlightTemplate = require('../templates/spotlight.template');
const tutorialTemplate = require('../templates/tutorial.template');
const newArrivalTemplate = require('../templates/newArrival.template');
const seasonalTemplate = require('../templates/seasonal.template');
const tipsTemplate = require('../templates/tips.template');
const portfolioTemplate = require('../templates/portfolio.template');
const aiRandomTemplate = require('../templates/aiRandom.template');

let genAI = null;
let textModel = null;
let imageModel = null;

// Model list cache (5 min TTL)
let modelListCache = null;
let modelListCacheTime = 0;
const MODEL_CACHE_TTL = 5 * 60 * 1000;

let testClientOverride = false;

/**
 * Initialize Gemini client with both text and image generation models
 */
function getGeminiRuntime(runtime = null) {
  return {
    apiKey: runtime?.apiKey || config.gemini.apiKey,
    textModel: runtime?.textModel || config.gemini.textModel,
    imageModel: runtime?.imageModel || config.gemini.imageModel,
  };
}

function init(runtime = null) {
  if (testClientOverride && genAI && textModel && imageModel) {
    return true;
  }

  const geminiRuntime = getGeminiRuntime(runtime);

  if (!geminiRuntime.apiKey) {
    console.warn('⚠️  GEMINI_API_KEY not configured. AI features will be disabled.');
    return false;
  }

  genAI = new GoogleGenerativeAI(geminiRuntime.apiKey);

  // Text model for caption generation
  textModel = genAI.getGenerativeModel({ model: geminiRuntime.textModel });

  // Image model for image generation (supports responseModalities: Image)
  imageModel = genAI.getGenerativeModel({
    model: geminiRuntime.imageModel,
    generationConfig: {
      responseModalities: ['Text', 'Image'],
    },
  });

  console.log(`✅ Gemini AI initialized`);
  console.log(`   Text model:  ${geminiRuntime.textModel}`);
  console.log(`   Image model: ${geminiRuntime.imageModel}`);
  return true;
}

function __setTestClient(genAIClient, textModelClient, imageModelClient) {
  genAI = genAIClient;
  textModel = textModelClient;
  imageModel = imageModelClient;
  testClientOverride = true;
}

function __resetTestClient() {
  testClientOverride = false;
  genAI = null;
  textModel = null;
  imageModel = null;
}

/**
 * List available Gemini models from the API via REST endpoint
 * (SDK v0.21.0 doesn't expose listModels — use direct HTTP call)
 * @returns {Array} - [{ id, name, description, supportedActions, inputTokenLimit, outputTokenLimit }]
 */
async function listModels(runtime = null) {
  const geminiRuntime = getGeminiRuntime(runtime);

  if (!geminiRuntime.apiKey) {
    return [];
  }

  // Return cache if still valid
  if (modelListCache && (Date.now() - modelListCacheTime) < MODEL_CACHE_TTL) {
    return modelListCache;
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${geminiRuntime.apiKey}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const result = (data.models || []).map(model => ({
      id: (model.name || '').replace('models/', ''),
      name: model.displayName || (model.name || '').replace('models/', ''),
      description: model.description || '',
      inputTokenLimit: model.inputTokenLimit || 0,
      outputTokenLimit: model.outputTokenLimit || 0,
      supportedActions: model.supportedGenerationMethods || [],
    }));

    modelListCache = result;
    modelListCacheTime = Date.now();
    console.log(`✅ Fetched ${result.length} Gemini models`);
    return result;
  } catch (error) {
    console.error('❌ Failed to list Gemini models:', error.message);
    return [];
  }
}

/**
 * Get the appropriate template module based on post type
 */
function getTemplate(postType) {
  switch (postType) {
    case 'BA': return baTemplate;
    case 'Review': return reviewTemplate;
    case 'BTS': return btsTemplate;
    case 'Promo': return promoTemplate;
    case 'Spotlight': return spotlightTemplate;
    case 'Tutorial': return tutorialTemplate;
    case 'NewArrival': return newArrivalTemplate;
    case 'Seasonal': return seasonalTemplate;
    case 'Tips': return tipsTemplate;
    case 'Portfolio': return portfolioTemplate;
    case 'AIRandom': return aiRandomTemplate;
    default: throw new Error(`Unknown post type: ${postType}`);
  }
}

/**
 * Convert an image file to a Gemini-compatible inline data part
 * @param {string} imagePath - Path to the image file
 * @returns {object} - { inlineData: { mimeType, data } }
 */
function fileToGenerativePart(imagePath) {
  const resolvedPath = path.resolve(imagePath);
  const imageData = fs.readFileSync(resolvedPath);
  const base64Data = imageData.toString('base64');

  const ext = path.extname(imagePath).toLowerCase();
  const mimeTypes = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
    '.bmp': 'image/bmp',
  };
  const mimeType = mimeTypes[ext] || 'image/jpeg';

  return {
    inlineData: {
      mimeType,
      data: base64Data,
    },
  };
}

function parseJsonFromText(text = '') {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    return JSON.parse(jsonMatch[0]);
  } catch (error) {
    return null;
  }
}

async function analyzeProductImage(imagePath, runtime = null) {
  if (!genAI && !init(runtime)) {
    return { success: false, analysis: null, error: 'Gemini API key not configured' };
  }

  try {
    const prompt = `You are a strict product visual analyst.
Analyze the uploaded product image and return JSON only with this exact shape:
{
  "productCategory": "...",
  "coreIdentity": ["shape", "packaging", "material", "branding"],
  "dominantColors": ["..."],
  "labelOrText": ["..."] ,
  "focalGuidance": "How to keep this product as hero while adding layout around it",
  "doNotChange": ["...", "..."]
}

Rules:
- Be specific and descriptive.
- Focus on what must be preserved to keep product identity consistent.
- Do not invent details not visible in image.`;

    const imagePart = fileToGenerativePart(imagePath);
    const activeTextModel = runtime?.textModel && genAI
      ? genAI.getGenerativeModel({ model: runtime.textModel })
      : textModel;

    const result = await activeTextModel.generateContent([prompt, imagePart]);
    const text = result.response.text();
    const parsed = parseJsonFromText(text);

    if (!parsed) {
      return {
        success: false,
        analysis: null,
        error: 'Failed to parse product analysis JSON',
      };
    }

    return {
      success: true,
      analysis: parsed,
      error: null,
    };
  } catch (error) {
    return {
      success: false,
      analysis: null,
      error: error.message,
    };
  }
}

function buildProductAnalysisBlock(analysisResult) {
  if (!analysisResult || !analysisResult.success || !analysisResult.analysis) {
    return '';
  }

  return `
PRODUCT ANALYSIS FROM UPLOADED IMAGE (must be obeyed):
${JSON.stringify(analysisResult.analysis, null, 2)}

Apply this analysis as hard guidance:
- Keep product identity unchanged.
- Make product the focal center.
- Build template layout and typography around the product.`;
}

/**
 * Generate a designed social media image using Gemini AI
 * Gemini receives the original photo + a design prompt → returns a fully designed image
 *
 * @param {string} imagePath - Path to the uploaded image
 * @param {string} postType - 'BA' | 'Review' | 'BTS' | 'Promo' | 'Spotlight' | 'Tutorial' | 'NewArrival' | 'Seasonal' | 'Tips' | 'Portfolio' | 'AIRandom'
 * @param {object} params - { title, content, serviceName }
 * @returns {object} - { success, imageBuffer, mimeType, error }
 */
async function generateImage(imagePath, postType, params = {}, options = {}) {
  const runtimeGemini = options.runtimeConfig?.gemini || null;
  let effectiveImageModel = options.imageModel || runtimeGemini?.imageModel || config.gemini.imageModel;

  if (!genAI && !init(runtimeGemini)) {
    return {
      success: false,
      imageBuffer: null,
      error: 'Gemini API key not configured',
      errorType: 'model_unavailable',
      similarityScore: null,
      generationAttempts: 0,
      generationStatus: 'failed',
    };
  }

  try {
    const template = getTemplate(postType);
    const imagePart = fileToGenerativePart(imagePath);

    // Use override model or default singleton
    let activeModel = imageModel;
    const runtimeDefaultImageModel = runtimeGemini?.imageModel || config.gemini.imageModel;
    if (effectiveImageModel && effectiveImageModel !== runtimeDefaultImageModel) {
      activeModel = genAI.getGenerativeModel({
        model: effectiveImageModel,
        generationConfig: { responseModalities: ['Text', 'Image'] },
      });
      console.log(`🔄 Using override image model: ${effectiveImageModel}`);
    }

    const maxAttempts = 1;
    let bestCandidate = null;
    let lastError = null;
    const productAnalysis = await analyzeProductImage(imagePath, runtimeGemini);
    const productAnalysisBlock = buildProductAnalysisBlock(productAnalysis);

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const basePrompt = template.buildImagePrompt(params);
      const prompt = `${basePrompt}\n${productAnalysisBlock}\n${buildRetryReinforcement(attempt)}`;

      console.log(`🎨 Generating ${postType} image with Gemini AI (attempt ${attempt}/${maxAttempts})...`);
      const startTime = Date.now();

      const result = await activeModel.generateContent([prompt, imagePart]);
      const response = result.response;
      const candidates = response.candidates;

      if (!candidates || candidates.length === 0) {
        lastError = 'Gemini returned no candidates';
        continue;
      }

      const parts = candidates[0].content?.parts || [];

      let imageBuffer = null;
      let responseMimeType = 'image/png';
      let responseText = '';

      for (const part of parts) {
        if (part.inlineData) {
          imageBuffer = Buffer.from(part.inlineData.data, 'base64');
          responseMimeType = part.inlineData.mimeType || 'image/png';
        } else if (part.text) {
          responseText = part.text;
        }
      }

      const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

      if (!imageBuffer) {
        lastError = responseText || 'Gemini did not generate an image.';
        continue;
      }

      bestCandidate = {
        imageBuffer,
        mimeType: responseMimeType,
        similarityScore: null,
        generationAttempts: attempt,
        maxAttempts,
        responseText,
      };

      console.log(`✅ Gemini image generated in ${elapsed}s (attempt ${attempt})`);

      return {
        success: true,
        imageBuffer,
        mimeType: responseMimeType,
        similarityScore: null,
        generationAttempts: attempt,
        maxAttempts,
        generationStatus: 'success',
        modelError: null,
        productAnalysis: productAnalysis.success ? productAnalysis.analysis : null,
      };
    }

    if (bestCandidate) {
      return {
        success: true,
        imageBuffer: bestCandidate.imageBuffer,
        mimeType: bestCandidate.mimeType,
        error: null,
        errorType: null,
        similarityScore: null,
        generationAttempts: 1,
        generationStatus: 'success',
        modelError: null,
        productAnalysis: productAnalysis.success ? productAnalysis.analysis : null,
      };
    }

    return {
      success: false,
      imageBuffer: null,
      error: lastError || 'Gemini image generation failed',
      errorType: 'generation_failed',
      similarityScore: null,
      generationAttempts: maxAttempts,
      maxAttempts,
      generationStatus: 'failed',
      modelError: lastError || 'Gemini image generation failed',
      productAnalysis: productAnalysis.success ? productAnalysis.analysis : null,
    };
  } catch (error) {
    const errMsg = error.message || String(error);
    console.error('❌ Gemini image generation error:', errMsg);

    // Provide helpful error messages
    if (errMsg.includes('SAFETY') || errMsg.includes('blocked')) {
      return {
        success: false,
        imageBuffer: null,
        error: 'Image bị chặn bởi safety filter của Gemini. Thử ảnh khác.',
        errorType: 'safety_blocked',
        similarityScore: null,
        generationAttempts: 0,
        generationStatus: 'failed',
        modelError: errMsg,
      };
    }
    if (errMsg.includes('quota') || errMsg.includes('429')) {
      return {
        success: false,
        imageBuffer: null,
        error: 'Hết quota Gemini API. Vui lòng thử lại sau.',
        errorType: 'quota_exceeded',
        similarityScore: null,
        generationAttempts: 0,
        generationStatus: 'failed',
        modelError: errMsg,
      };
    }
    if (errMsg.includes('not found') || errMsg.includes('404')) {
      const modelName = effectiveImageModel || config.gemini.imageModel;
      return {
        success: false,
        imageBuffer: null,
        error: `Model "${modelName}" không tồn tại hoặc chưa được kích hoạt. Kiểm tra model name.`,
        errorType: 'model_not_found',
        similarityScore: null,
        generationAttempts: 0,
        generationStatus: 'failed',
        modelError: errMsg,
      };
    }

    return {
      success: false,
      imageBuffer: null,
      error: errMsg,
      errorType: 'unknown_model_error',
      similarityScore: null,
      generationAttempts: 0,
      generationStatus: 'failed',
      modelError: errMsg,
    };
  }
}

/**
 * Generate caption using Gemini AI
 * @param {string} postType - 'BA' | 'Review' | 'BTS' | 'Promo' | 'Spotlight' | 'Tutorial' | 'NewArrival' | 'Seasonal' | 'Tips' | 'Portfolio' | 'AIRandom'
 * @param {object} params - { title, content, serviceName }
 * @param {object} options - { textModel } optional runtime model override
 * @returns {object} - { caption, shortCaption, hashtags }
 */
async function generateCaption(postType, params, options = {}) {
  const runtimeGemini = options.runtimeConfig?.gemini || null;

  if (!genAI && !init(runtimeGemini)) {
    return getFallbackCaption(postType, params);
  }

  try {
    const template = getTemplate(postType);
    const prompt = template.buildCaptionPrompt(params);

    // Use override model or default singleton
    let activeModel = textModel;
    const effectiveTextModel = options.textModel || runtimeGemini?.textModel || config.gemini.textModel;
    const runtimeDefaultTextModel = runtimeGemini?.textModel || config.gemini.textModel;
    if (effectiveTextModel && effectiveTextModel !== runtimeDefaultTextModel) {
      activeModel = genAI.getGenerativeModel({ model: effectiveTextModel });
      console.log(`🔄 Using override text model: ${effectiveTextModel}`);
    }

    const result = await activeModel.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    // Parse JSON response from Gemini
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          caption: parsed.caption || text,
          shortCaption: parsed.shortCaption || '',
          hashtags: parsed.hashtags || [],
        };
      } catch (parseError) {
        console.warn('Failed to parse Gemini JSON response, using raw text');
        return { caption: text, shortCaption: '', hashtags: [] };
      }
    }

    return { caption: text, shortCaption: '', hashtags: [] };
  } catch (error) {
    console.error('Gemini caption error:', error.message);
    return getFallbackCaption(postType, params);
  }
}

/**
 * Fallback caption when Gemini is unavailable
 */
function getFallbackCaption(postType, params) {
  const brand = config.brand;
  const title = params.title || '';
  const content = params.content || '';

  const templates = {
    BA: `✨ BEFORE & AFTER ✨\n\n${title}\n\n${content || 'The results speak for themselves! From sparse lashes to captivating eyes 🖤'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #noimi #beforeafter #lamdepmat`,
    Review: `💕 CLIENT REVIEW 💕\n\n${title}\n\n${content || 'Thank you for trusting us! Her reaction when she looked in the mirror was truly unforgettable 😍'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #reviewkhachhang #noimi`,
    BTS: `🎬 BEHIND THE SCENES 🎬\n\n${title}\n\n${content || 'Every single lash placed with precision and care ✨'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #behindthescenes #noimi`,
    Promo: `🔥 SPECIAL OFFER 🔥\n\n${title}\n\n${content || 'Limited-time deal — book your appointment now!'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #khuyenmai #noimi`,
    Spotlight: `⭐ LASH SPOTLIGHT ⭐\n\n${title}\n\n${content || 'Every lash placed with meticulous attention to detail 🖤'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #lashspotlight #noimi`,
    Tutorial: `📚 LASH TUTORIAL 📚\n\n${title}\n\n${content || 'Salon-grade lash care tips to keep your lashes looking gorgeous every day ✨'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #lashtutorial #lashcare #noimi`,
    NewArrival: `🆕 NOW AVAILABLE 🆕\n\n${title}\n\n${content || 'Our newest service is ready — DM us to secure your slot first!'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #newarrival #noimi #lashservice`,
    Seasonal: `🎄 SEASONAL LASH SPECIAL 🎄\n\n${title}\n\n${content || 'A seasonal concept to keep your look elegantly on-trend all season long ✨'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #seasonalbeauty #holidaylook #noimi`,
    Tips: `💡 PRO LASH TIPS 💡\n\n${title}\n\n${content || 'Simple habits done right to keep your lashes lasting longer and looking lighter every day!'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #lashcaretips #didyouknow #noimi`,
    Portfolio: `🖼️ PORTFOLIO HIGHLIGHTS 🖼️\n\n${title}\n\n${content || 'Every lash set is its own unique design, tailored to each eye shape ✨'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #lashportfolio #ourwork #noimi`,
    AIRandom: `🎲 AI CREATIVE CONCEPT 🎲\n\n${title}\n\n${content || 'AI-selected concept based on your uploaded product photo — a one-of-a-kind design ✨'}\n\n📍 ${brand.name}\n📞 Hotline: ${brand.hotline}\n🌐 ${brand.website}\n\n#${brand.name.replace(/\s+/g, '')} #aidesign #creativeconcept #noimi`,
  };

  return {
    caption: templates[postType] || templates.BA,
    shortCaption: title || `${brand.name} - Professional Lash Extensions`,
    hashtags: [`#${brand.name.replace(/\s+/g, '')}`, '#noimi'],
  };
}

// Initialize on require
init();

module.exports = {
  generateImage,
  generateCaption,
  listModels,
  init,
  __setTestClient,
  __resetTestClient,
};
