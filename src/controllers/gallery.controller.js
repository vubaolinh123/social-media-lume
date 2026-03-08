const mongoose = require('mongoose');
const config = require('../config');
const PostAsset = require('../models/post-asset.model');
const User = require('../models/user.model');
const facebookService = require('../services/facebook.service');
const instagramService = require('../services/instagram.service');
const { buildRuntimeConfig } = require('../services/runtime-config.service');

function getServiceStatus() {
  return {
    gemini: !!config.gemini.apiKey,
    facebook: !!config.facebook.pageAccessToken,
    instagram: !!config.facebook.pageAccessToken,
    telegram: !!(config.telegram.botToken && config.telegram.chatId),
  };
}

function parseOwnerId(req) {
  if (!req.user || !req.user.id || !mongoose.isValidObjectId(req.user.id)) return null;
  return req.user.id;
}

function toChannelPayload(result = null) {
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

function computeStatusFromChannels(facebook, instagram) {
  const fb = facebook || {};
  const ig = instagram || {};

  if (fb.success || ig.success) {
    return {
      status: 'published',
      message: 'Đã đăng bài thành công lên mạng xã hội.',
    };
  }

  if (fb.skipped === true && ig.skipped === true) {
    return {
      status: 'created_only',
      message: 'Nội dung đã được tạo nhưng chưa đăng lên mạng xã hội.',
    };
  }

  return {
    status: 'failed',
    message: 'Đăng bài thất bại. Vui lòng kiểm tra cấu hình token.',
  };
}

function mapItemForView(doc) {
  return {
    id: String(doc._id),
    title: doc.title || 'Untitled',
    postType: doc.postType,
    caption: doc.caption || '',
    createdAt: doc.createdAt,
    aiGenerated: !!doc.aiGenerated,
    similarityScore: doc.similarityScore,
    generationStatus: doc.generationStatus,
    isVideo: !!doc.isVideo,
    originalSrc: `/uploads/${doc.originalFilename}`,
    generatedSrc: doc.generatedFilename ? `/output/${doc.generatedFilename}` : null,
    publishStatus: doc.publishStatus || {},
    modelError: doc.modelError || null,
  };
}

async function showGallery(req, res) {
  const ownerId = parseOwnerId(req);
  if (!ownerId) {
    return res.redirect('/login');
  }

  const items = await PostAsset
    .find({ userId: ownerId })
    .sort({ createdAt: -1 })
    .limit(200);

  return res.render('gallery', {
    brand: config.brand,
    user: req.user || null,
    services: getServiceStatus(),
    items: items.map(mapItemForView),
    pageTitle: 'Thư viện ảnh - LUMÉ LASHES',
  });
}

async function listGalleryItems(req, res) {
  const ownerId = parseOwnerId(req);
  if (!ownerId) {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }

  const items = await PostAsset
    .find({ userId: ownerId })
    .sort({ createdAt: -1 })
    .limit(200);

  return res.json({
    success: true,
    items: items.map(mapItemForView),
  });
}

async function publishFacebook(req, res) {
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

    const owner = await User.findById(ownerId);
    const runtimeConfig = buildRuntimeConfig(owner);

    let result;
    if (!runtimeConfig.facebook.pageAccessToken) {
      result = { success: false, skipped: true, error: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured' };
    } else if (post.isVideo) {
      result = await facebookService.postVideoToPage(post.originalFilePath, post.caption, runtimeConfig);
    } else {
      const imagePath = post.generatedFilePath || post.originalFilePath;
      result = await facebookService.postToPage(imagePath, post.caption, runtimeConfig);
    }

    post.publishStatus.facebook = toChannelPayload(result);
    const summary = computeStatusFromChannels(post.publishStatus.facebook, post.publishStatus.instagram);
    post.publishStatus.status = summary.status;
    post.publishStatus.message = summary.message;
    await post.save();

    return res.json({
      success: !!result.success,
      message: result.success ? 'Đã đăng Facebook thành công' : (result.error || 'Đăng Facebook thất bại'),
      result,
      publishStatus: post.publishStatus,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function publishInstagram(req, res) {
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

    const owner = await User.findById(ownerId);
    const runtimeConfig = buildRuntimeConfig(owner);

    if (post.isVideo) {
      return res.status(400).json({ success: false, message: 'Video posting to Instagram not supported in this flow' });
    }

    if (!runtimeConfig.facebook.pageAccessToken) {
      return res.status(400).json({ success: false, message: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured' });
    }

    let facebookResult = post.publishStatus?.facebook || null;
    let facebookPostId = facebookResult?.success ? facebookResult.postId : null;

    if (!facebookPostId) {
      const imagePath = post.generatedFilePath || post.originalFilePath;
      const postedToFb = await facebookService.postToPage(imagePath, post.caption, runtimeConfig);
      facebookResult = toChannelPayload(postedToFb);
      post.publishStatus.facebook = facebookResult;

      if (!postedToFb.success) {
        const summary = computeStatusFromChannels(post.publishStatus.facebook, post.publishStatus.instagram);
        post.publishStatus.status = summary.status;
        post.publishStatus.message = summary.message;
        await post.save();

        return res.status(400).json({
          success: false,
          message: postedToFb.error || 'Facebook post failed — cannot continue Instagram',
          facebook: postedToFb,
        });
      }

      facebookPostId = postedToFb.postId;
    }

    const imageUrl = `https://graph.facebook.com/${facebookPostId}/picture`;
    const instagramRawResult = await instagramService.postToInstagram(imageUrl, post.caption, runtimeConfig);
    const instagramResult = toChannelPayload(instagramRawResult);

    post.publishStatus.instagram = instagramResult;
    const summary = computeStatusFromChannels(post.publishStatus.facebook, post.publishStatus.instagram);
    post.publishStatus.status = summary.status;
    post.publishStatus.message = summary.message;
    await post.save();

    return res.json({
      success: !!instagramRawResult.success,
      message: instagramRawResult.success ? 'Đã đăng Instagram thành công' : (instagramRawResult.error || 'Đăng Instagram thất bại'),
      instagram: instagramRawResult,
      facebook: post.publishStatus.facebook,
      publishStatus: post.publishStatus,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  showGallery,
  listGalleryItems,
  publishFacebook,
  publishInstagram,
};
