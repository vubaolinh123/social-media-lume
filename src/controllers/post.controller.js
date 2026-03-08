/**
 * Post Controller
 * Orchestrates: upload -> process image -> generate caption -> preview -> approve -> publish
 * Graceful degradation: works with only Gemini API key; social publishing is optional
 */
const mongoose = require('mongoose');
const path = require('path');
const config = require('../config');
const imageService = require('../services/image.service');
const geminiService = require('../services/gemini.service');
const facebookService = require('../services/facebook.service');
const instagramService = require('../services/instagram.service');
const telegramService = require('../services/telegram.service');
const PostAsset = require('../models/post-asset.model');
const User = require('../models/user.model');
const { deleteFileSafe } = require('../services/file.service');
const { buildRuntimeConfig } = require('../services/runtime-config.service');
const { enqueueProcessing } = require('../services/job-queue.service');
const { isImage, isVideo } = require('../utils/helpers');

/**
 * Check which services are currently configured
 */
function getServiceStatus() {
  return {
    gemini: !!config.gemini.apiKey,
    facebook: !!config.facebook.pageAccessToken,
    instagram: !!config.facebook.pageAccessToken, // Instagram uses same token
    telegram: !!(config.telegram.botToken && config.telegram.chatId),
  };
}

function getServiceStatusFromRuntime(runtimeConfig) {
  return {
    gemini: !!runtimeConfig?.gemini?.apiKey,
    facebook: !!runtimeConfig?.facebook?.pageAccessToken,
    instagram: !!runtimeConfig?.facebook?.pageAccessToken,
    telegram: !!(runtimeConfig?.telegram?.botToken && runtimeConfig?.telegram?.chatId),
  };
}

function showForm(req, res) {
  res.render('index', { brand: config.brand, error: null, success: null, user: req.user || null, toastError: null });
}

function normalizeChannelResult(result = null) {
  if (!result) {
    return {
      success: false,
      skipped: true,
      postId: null,
      error: 'not_attempted',
      publishedAt: null,
    };
  }

  return {
    success: !!result.success,
    skipped: !!result.skipped,
    postId: result.postId || null,
    error: result.error || null,
    publishedAt: result.success ? new Date() : null,
  };
}

function mapPostForPreview(postDoc) {
  return {
    id: String(postDoc._id),
    title: postDoc.title,
    content: postDoc.content,
    postType: postDoc.postType,
    caption: postDoc.caption,
    shortCaption: postDoc.shortCaption,
    hashtags: postDoc.hashtags,
    aiGenerated: postDoc.aiGenerated,
    isVideo: postDoc.isVideo,
    logoPosition: postDoc.logoPosition,
    qrPosition: postDoc.qrPosition,
    aiError: postDoc.aiError || null,
    aiErrorType: postDoc.aiErrorType || null,
    modelError: postDoc.modelError || null,
    similarityScore: postDoc.similarityScore ?? null,
    generationStatus: postDoc.generationStatus || 'pending',
    productAnalysis: postDoc.productAnalysis || null,
    processing: postDoc.generationStatus === 'processing',
    createdAt: postDoc.createdAt,
  };
}

function parseOwnerId(req) {
  if (!req.user || !req.user.id || !mongoose.isValidObjectId(req.user.id)) return null;
  return req.user.id;
}

/**
 * API endpoint: return current service configuration status
 */
function checkStatus(req, res) {
  const warnings = [];

  // fallback to env status when user lookup is unavailable
  if (!req.user?.id || !mongoose.isValidObjectId(req.user.id)) {
    const status = getServiceStatus();
    if (!status.gemini) warnings.push('GEMINI_API_KEY chưa được cấu hình — không thể tạo caption AI');
    if (!status.facebook) warnings.push('FACEBOOK_PAGE_ACCESS_TOKEN chưa được cấu hình — không thể đăng lên Facebook & Instagram');
    if (!status.telegram) warnings.push('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID chưa được cấu hình — không có chức năng duyệt bài qua Telegram');
    return res.json({ success: true, services: status, warnings });
  }

  return User.findById(req.user.id)
    .then((owner) => {
      const runtimeConfig = buildRuntimeConfig(owner);
      const status = getServiceStatusFromRuntime(runtimeConfig);

      if (!status.gemini) {
        warnings.push('GEMINI_API_KEY chưa được cấu hình — không thể tạo caption AI');
      }
      if (!status.facebook) {
        warnings.push('FACEBOOK_PAGE_ACCESS_TOKEN chưa được cấu hình — không thể đăng lên Facebook & Instagram');
      }
      if (!status.telegram) {
        warnings.push('TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID chưa được cấu hình — không có chức năng duyệt bài qua Telegram');
      }

      return res.json({ success: true, services: status, warnings });
    })
    .catch((error) => res.status(500).json({ success: false, message: error.message }));
}

async function createPost(req, res) {
  try {
    const { title, content, postType, logoPosition, qrPosition, imageModel, textModel, includeFooterContact } = req.body;
    const file = req.file;

    if (!file) {
      return res.render('index', { brand: config.brand, error: 'Vui lòng tải lên ảnh hoặc video', success: null, user: req.user || null, toastError: null });
    }
    if (!postType) {
      return res.render('index', { brand: config.brand, error: 'Vui lòng chọn loại bài viết', success: null, user: req.user || null, toastError: null });
    }

    const uploadedPath = path.resolve(file.path);
    const ownerId = parseOwnerId(req);

    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const fileIsImage = isImage(file.originalname);
    const fileIsVideo = isVideo(file.originalname);

    const owner = await User.findById(ownerId);
    const runtimeConfig = buildRuntimeConfig(owner);
    const services = getServiceStatusFromRuntime(runtimeConfig);
    const generationStatus = fileIsImage ? 'processing' : 'success';

    // Persist post asset in MongoDB
    const createdPost = await PostAsset.create({
      userId: ownerId,
      title,
      content,
      postType,
      caption: '',
      shortCaption: '',
      hashtags: [],
      originalFilePath: uploadedPath,
      originalFilename: file.filename,
      generatedFilePath: null,
      generatedFilename: null,
      aiGenerated: false,
      aiError: null,
      aiErrorType: null,
      modelError: null,
      productAnalysis: null,
      similarityScore: null,
      generationAttempts: 0,
      generationStatus,
      requestedImageModel: imageModel || null,
      requestedTextModel: textModel || null,
      includeFooterContact: includeFooterContact !== 'off',
      isVideo: fileIsVideo,
      logoPosition: logoPosition || 'bottom-left',
      qrPosition: qrPosition || 'bottom-right',
      publishStatus: {
        status: 'pending',
      },
    });

    const postData = mapPostForPreview(createdPost);

    res.render('preview', {
      brand: config.brand,
      post: postData,
      imageSrc: createdPost.generatedFilename ? `/output/${createdPost.generatedFilename}` : null,
      originalSrc: `/uploads/${file.filename}`,
      services,
      user: req.user || null,
      notifications: {
        warnMessage: createdPost.generationStatus === 'processing'
          ? 'Ảnh đang được AI tạo ở nền. Bạn có thể mở Gallery để theo dõi realtime.'
          : null,
        errorMessage: null,
      },
    });

    if (fileIsImage) {
      enqueueProcessing();
    }
  } catch (error) {
    console.error('Error creating post:', error);
    res.render('index', {
      brand: config.brand,
      error: `Lỗi: ${error.message}`,
      success: null,
      user: req.user || null,
      toastError: error.modelError ? `Gemini model error: ${error.modelError}` : null,
    });
  }
}

async function approvePost(req, res) {
  try {
    const { postId, caption: editedCaption } = req.body;
    const ownerId = parseOwnerId(req);

    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(404).json({ success: false, message: 'Bài viết không tìm thấy' });
    }

    const post = await PostAsset.findOne({ _id: postId, userId: ownerId });

    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài viết không tìm thấy' });
    }

    if (editedCaption) post.caption = editedCaption;

    const owner = await User.findById(ownerId);
    const runtimeConfig = buildRuntimeConfig(owner);

    const imagePath = post.generatedFilePath || post.originalFilePath;
    const services = getServiceStatusFromRuntime(runtimeConfig);
    const results = { facebook: null, instagram: null };
    const warnings = [];
    let telegramAction = null;

    // Step 3: Send to Telegram for approval (if configured)
    if (services.telegram) {
      console.log('Sending to Telegram...');
      const approval = await telegramService.sendForApprovalWithRuntime(imagePath, post.caption, post.postType, runtimeConfig);
      telegramAction = approval.action;

      if (!approval.approved) {
        post.publishStatus = {
          status: 'cancelled',
          facebook: normalizeChannelResult(results.facebook),
          instagram: normalizeChannelResult(results.instagram),
          warnings,
          approvalAction: telegramAction,
          message: 'Bài viết đã bị huỷ trên Telegram',
        };
        await post.save();
        return res.json({ success: false, message: 'Bài viết đã bị huỷ trên Telegram', action: approval.action });
      }
    } else {
      warnings.push('Telegram chưa được cấu hình — bỏ qua bước duyệt bài, đăng trực tiếp');
      telegramAction = 'telegram_not_configured';
    }

    // Step 4: Publish to Facebook (if configured)
    if (services.facebook) {
      if (post.isVideo) {
        results.facebook = await facebookService.postVideoToPage(post.originalFilePath, post.caption, runtimeConfig);
      } else {
        results.facebook = await facebookService.postToPage(imagePath, post.caption, runtimeConfig);
      }
    } else {
      warnings.push('Facebook chưa được cấu hình — bỏ qua đăng Facebook');
      results.facebook = { success: false, skipped: true, error: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured' };
    }

    // Step 5: Publish to Instagram (if FB succeeded and configured)
    if (services.instagram && results.facebook?.success && !post.isVideo) {
      try {
        results.instagram = await instagramService.postToInstagram(
          `https://graph.facebook.com/${results.facebook.postId}/picture`,
          post.caption,
          runtimeConfig
        );
      } catch (igError) {
        console.warn('Instagram posting skipped:', igError.message);
        results.instagram = { success: false, error: igError.message };
      }
    } else if (!services.instagram) {
      warnings.push('Instagram chưa được cấu hình — bỏ qua đăng Instagram');
      results.instagram = { success: false, skipped: true, error: 'Token not configured' };
    } else if (post.isVideo) {
      results.instagram = { success: false, skipped: true, error: 'Video posting to Instagram not supported in this flow' };
    } else if (!results.facebook?.success && services.facebook) {
      results.instagram = { success: false, skipped: true, error: 'Facebook post failed — cannot get image URL for Instagram' };
    }

    // Determine overall status
    const facebookResult = normalizeChannelResult(results.facebook);
    const instagramResult = normalizeChannelResult(results.instagram);
    const anyPublished = facebookResult.success || instagramResult.success;
    const allSkipped = facebookResult.skipped && instagramResult.skipped;

    let message;
    let status;

    if (anyPublished) {
      const parts = [];
      if (results.facebook?.success) parts.push('Facebook');
      if (results.instagram?.success) parts.push('Instagram');
      message = `Đã đăng bài thành công lên ${parts.join(' & ')}!`;
      status = 'published';
    } else if (allSkipped) {
      message = 'Nội dung đã được tạo thành công! Chưa đăng lên mạng xã hội do chưa cấu hình token.';
      status = 'created_only';
    } else {
      message = 'Đăng bài thất bại. Vui lòng kiểm tra cấu hình token.';
      status = 'failed';
    }

    post.publishStatus = {
      status,
      facebook: facebookResult,
      instagram: instagramResult,
      warnings,
      approvalAction: telegramAction,
      message,
    };
    await post.save();

    return res.json({
      success: true,
      status,
      message,
      warnings,
      approval: telegramAction,
      results,
    });
  } catch (error) {
    console.error('Error approving post:', error);
    return res.status(500).json({ success: false, message: `Lỗi: ${error.message}` });
  }
}

async function getPostGenerationStatus(req, res) {
  try {
    const ownerId = parseOwnerId(req);
    const { postId } = req.params;
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' });
    if (!mongoose.isValidObjectId(postId)) return res.status(404).json({ success: false, message: 'Not found' });

    const post = await PostAsset.findOne({ _id: postId, userId: ownerId });
    if (!post) return res.status(404).json({ success: false, message: 'Not found' });

    return res.json({
      success: true,
      status: post.generationStatus,
      post: {
        id: String(post._id),
        generatedSrc: post.generatedFilename ? `/output/${post.generatedFilename}` : null,
        originalSrc: `/uploads/${post.originalFilename}`,
        aiGenerated: !!post.aiGenerated,
        modelError: post.modelError || null,
        aiError: post.aiError || null,
        caption: post.caption || '',
        shortCaption: post.shortCaption || '',
        hashtags: post.hashtags || [],
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function regenerateCaption(req, res) {
  try {
    const { postId } = req.body;
    const ownerId = parseOwnerId(req);

    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(404).json({ success: false, message: 'Bài viết không tìm thấy' });
    }

    const post = await PostAsset.findOne({ _id: postId, userId: ownerId });
    if (!post) return res.status(404).json({ success: false, message: 'Bài viết không tìm thấy' });

    const owner = await User.findById(ownerId);
    const runtimeConfig = buildRuntimeConfig(owner);

    const captionResult = await geminiService.generateCaption(post.postType, {
      title: post.title || '',
      content: post.content || '',
      serviceName: '',
      brand: runtimeConfig.brand,
    }, {
      textModel: post.requestedTextModel || runtimeConfig.gemini.textModel || undefined,
      runtimeConfig,
    });

    post.caption = captionResult.caption;
    post.shortCaption = captionResult.shortCaption;
    post.hashtags = captionResult.hashtags;

    return res.json({ success: true, caption: captionResult.caption, shortCaption: captionResult.shortCaption, hashtags: captionResult.hashtags });
  } catch (error) {
    console.error('Error regenerating caption:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * API endpoint: delete a post asset + both original/generated files
 */
async function deletePostAsset(req, res) {
  try {
    const ownerId = parseOwnerId(req);
    const { postId } = req.params;

    if (!ownerId) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    if (!mongoose.isValidObjectId(postId)) {
      return res.status(404).json({ success: false, message: 'Bài viết không tìm thấy' });
    }

    const post = await PostAsset.findOne({ _id: postId, userId: ownerId });
    if (!post) {
      return res.status(404).json({ success: false, message: 'Bài viết không tìm thấy' });
    }

    const deleteOriginal = await deleteFileSafe(post.originalFilePath);
    if (!deleteOriginal.success) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa ảnh gốc',
        reason: deleteOriginal.reason,
      });
    }

    const deleteGenerated = await deleteFileSafe(post.generatedFilePath);
    if (!deleteGenerated.success) {
      return res.status(500).json({
        success: false,
        message: 'Không thể xóa ảnh đã gen',
        reason: deleteGenerated.reason,
      });
    }

    await post.deleteOne();

    return res.json({
      success: true,
      message: 'Đã xóa ảnh gốc và ảnh AI thành công',
    });
  } catch (error) {
    console.error('Error deleting post asset:', error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

/**
 * API endpoint: list available Gemini models
 */
async function listModels(req, res) {
  try {
    const ownerId = parseOwnerId(req);
    const owner = ownerId ? await User.findById(ownerId) : null;
    const runtimeConfig = buildRuntimeConfig(owner);
    const models = await geminiService.listModels(runtimeConfig.gemini);

    // Separate into image-capable and text-only for frontend convenience
    const imageModels = models.filter(m =>
      m.id.includes('image') ||
      m.supportedActions.includes('generateContent')
    );
    const textModels = models.filter(m =>
      m.supportedActions.includes('generateContent')
    );

    return res.json({
      success: true,
      models: { all: models, image: imageModels, text: textModels },
      defaults: {
        imageModel: runtimeConfig.gemini.imageModel,
        textModel: runtimeConfig.gemini.textModel,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = { showForm, createPost, approvePost, regenerateCaption, deletePostAsset, getPostGenerationStatus, checkStatus, listModels };
