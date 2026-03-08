const PostAsset = require('../models/post-asset.model');
const imageService = require('./image.service');
const geminiService = require('./gemini.service');
const { buildRuntimeConfig } = require('./runtime-config.service');
const User = require('../models/user.model');
const mongoose = require('mongoose');
const EventEmitter = require('events');

const jobEvents = new EventEmitter();

function emitPostStatus(post) {
  try {
    jobEvents.emit('post-status', {
      userId: post.userId ? String(post.userId) : null,
      postId: String(post._id),
      status: post.generationStatus,
      generatedSrc: post.generatedFilename ? `/output/${post.generatedFilename}` : null,
      originalSrc: post.originalFilename ? `/uploads/${post.originalFilename}` : null,
      caption: post.caption || '',
      shortCaption: post.shortCaption || '',
      hashtags: post.hashtags || [],
      modelError: post.modelError || null,
      aiError: post.aiError || null,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    // noop
  }
}

let processing = false;
const MAX_CONCURRENT_JOBS = 1;

async function processOneJob() {
  if (mongoose.connection.readyState !== 1) return false;

  const next = await PostAsset.findOne({ generationStatus: 'processing' }).sort({ createdAt: 1 });
  if (!next) return false;

  try {
    const owner = await User.findById(next.userId);
    const runtimeConfig = buildRuntimeConfig(owner);

    if (next.isVideo) {
      next.aiGenerated = false;
      next.generationStatus = 'success';
    } else {
      const processedImage = await imageService.processImage(next.originalFilePath, next.postType, {
        title: next.title || '',
        content: next.content || '',
        serviceName: next.content || '',
        includeFooterContact: next.includeFooterContact !== false,
        logoPosition: next.logoPosition || 'bottom-left',
        qrPosition: next.qrPosition || 'bottom-right',
        imageModel: next.requestedImageModel || runtimeConfig.gemini.imageModel || undefined,
        brand: runtimeConfig.brand,
        runtimeConfig,
      });

      next.generatedFilePath = processedImage.outputPath;
      next.generatedFilename = processedImage.outputFilename;
      next.aiGenerated = processedImage.aiGenerated;
      next.aiError = processedImage.aiError || null;
      next.aiErrorType = processedImage.aiErrorType || null;
      next.modelError = processedImage.modelError || null;
      next.productAnalysis = processedImage.productAnalysis || null;
      next.similarityScore = processedImage.similarityScore ?? null;
      next.generationAttempts = processedImage.generationAttempts ?? 1;
      next.generationStatus = processedImage.generationStatus || 'success';
    }

    const captionResult = await geminiService.generateCaption(next.postType, {
      title: next.title || '',
      content: next.content || '',
      serviceName: next.content || '',
      brand: runtimeConfig.brand,
    }, {
      textModel: next.requestedTextModel || runtimeConfig.gemini.textModel || undefined,
      runtimeConfig,
    });

    next.caption = captionResult.caption || '';
    next.shortCaption = captionResult.shortCaption || '';
    next.hashtags = Array.isArray(captionResult.hashtags) ? captionResult.hashtags : [];

    await next.save();
    emitPostStatus(next);
  } catch (error) {
    if (mongoose.connection.readyState === 1) {
      next.generationStatus = 'failed';
      next.aiError = error.message;
      next.modelError = error.modelError || error.message;
      await next.save();
      emitPostStatus(next);
    }
  }

  return true;
}

async function runQueueLoop() {
  if (processing) return;
  processing = true;

  try {
    let hadWork = true;
    while (hadWork) {
      let processedCount = 0;
      while (processedCount < MAX_CONCURRENT_JOBS) {
        const ok = await processOneJob();
        if (!ok) break;
        processedCount += 1;
      }
      hadWork = processedCount > 0;
    }
  } finally {
    processing = false;
  }
}

function enqueueProcessing() {
  setImmediate(() => {
    runQueueLoop().catch((error) => {
      console.error('Job queue loop error:', error);
    });
  });
}

module.exports = {
  enqueueProcessing,
  jobEvents,
  emitPostStatus,
};
