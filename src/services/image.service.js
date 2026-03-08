/**
 * Image Service
 * New flow:
 *  1. User uploads an image
 *  2. Gemini AI receives the image + a design prompt → generates a fully designed social media image
 *  3. Sharp composites logo + QR code onto the AI-generated image
 *  4. Result is saved to output directory
 */

const sharp = require('sharp');
const path = require('path');
const config = require('../config');
const { generateFilename, ensureDir } = require('../utils/helpers');
const { compositeLogoAndQR } = require('../templates/image/shared.template');
const geminiService = require('./gemini.service');

// VPS-friendly Sharp tuning (1 core / 1GB RAM)
sharp.concurrency(1);
sharp.cache({ memory: 50, files: 0, items: 100 });

/**
 * Process an image with AI-powered template generation
 * @param {string} imagePath - Path to uploaded image
 * @param {string} postType - 'BA' | 'Review' | 'BTS' | 'Promo' | 'Spotlight'
 * @param {object} options - { title, content, serviceName, logoPosition, qrPosition }
 * @returns {object} - { outputPath, outputFilename, outputBuffer, aiGenerated }
 */
async function processImage(imagePath, postType, options = {}) {
  // Step 1: Send image to Gemini for AI template generation
  const aiResult = await geminiService.generateImage(imagePath, postType, {
    title: options.title || '',
    content: options.serviceName || '',
    serviceName: options.serviceName || '',
    includeFooterContact: options.includeFooterContact !== false,
    brand: options.brand || undefined,
  }, {
    imageModel: options.imageModel,
    runtimeConfig: options.runtimeConfig,
  });

  let imageBuffer;
  let aiGenerated = false;
  let similarityScore = aiResult.similarityScore ?? null;
  let generationAttempts = aiResult.generationAttempts ?? 0;
  let generationStatus = aiResult.generationStatus || 'failed';
  let aiError = aiResult.error || null;
  let aiErrorType = aiResult.errorType || null;
  let modelError = aiResult.modelError || null;
  let productAnalysis = aiResult.productAnalysis || null;

  if (aiResult.success && aiResult.imageBuffer) {
    // AI generated a designed image — use it
    imageBuffer = aiResult.imageBuffer;
    aiGenerated = true;
    generationStatus = aiResult.generationStatus || 'success';
    if (generationStatus === 'similarity_failed') {
      console.warn('⚠️  Similarity below threshold but keeping generated image for user review.');
    }
    console.log('✅ Using Gemini-generated template image');
  } else {
    // Fallback: use the original image as-is (resize to standard dimensions)
    console.warn('⚠️  AI image generation failed, using original image as fallback');
    console.warn('   Reason:', aiResult.error);
    generationStatus = 'failed';
    imageBuffer = await sharp(imagePath)
      .resize(1080, 1350, { fit: 'cover', position: 'centre' })
      .png()
      .toBuffer();
  }

  // Step 2: Ensure the image buffer is in a compatible format for sharp
  imageBuffer = await sharp(imageBuffer).png().toBuffer();

  // Step 3: Overlay logo and QR code using sharp
  imageBuffer = await compositeLogoAndQR(imageBuffer, {
    logoPosition: options.logoPosition || 'bottom-left',
    qrPosition: options.qrPosition || 'bottom-right',
    phone: options.brand?.phone || options.brand?.hotline || config.brand.phone,
    address: options.brand?.address || config.brand.address,
  });

  // Step 4: Save to output directory
  ensureDir(config.paths.output);
  const outputFilename = generateFilename('.png');
  const outputPath = path.join(config.paths.output, outputFilename);

  await sharp(imageBuffer).toFile(outputPath);

  return {
    outputPath,
    outputFilename,
    outputBuffer: imageBuffer,
    aiGenerated,
    similarityScore,
    generationAttempts,
    generationStatus,
    aiError,
    aiErrorType,
    modelError,
    productAnalysis,
  };
}

module.exports = { processImage };
