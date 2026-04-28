const axios = require('axios');
const fs = require('fs');
const path = require('path');
const config = require('../config');

function getBlotatoConfig(runtimeConfig) {
  return runtimeConfig?.blotato || config.blotato;
}

function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const map = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.mp4': 'video/mp4',
    '.mov': 'video/quicktime',
    '.avi': 'video/x-msvideo',
  };
  return map[ext] || 'application/octet-stream';
}

function truncateHashtagsForInstagram(text, max = 5) {
  if (!text) return text;
  const tokens = text.split(/(\s+)/);
  let hashtagCount = 0;
  const result = tokens.filter(token => {
    if (/^#\S+/.test(token)) {
      if (hashtagCount >= max) return false;
      hashtagCount++;
    }
    return true;
  });
  return result.join('').trim();
}

async function uploadMedia(filePath, blotatoCfg) {
  const filename = path.basename(filePath);

  const presignRes = await axios.post(
    `${blotatoCfg.baseUrl}/media/uploads`,
    { filename },
    {
      headers: {
        'blotato-api-key': blotatoCfg.apiKey,
        'Content-Type': 'application/json',
      },
    }
  );

  const { presignedUrl, publicUrl } = presignRes.data;

  const fileBuffer = fs.readFileSync(filePath);
  await axios.put(presignedUrl, fileBuffer, {
    headers: { 'Content-Type': getMimeType(filePath) },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return publicUrl;
}

/**
 * Post image + caption to Instagram via Blotato
 * @param {string} imageUrlOrPath - Public URL or local file path of the image
 * @param {string} caption - Post caption
 * @param {object} runtimeConfig - Optional runtime config override
 * @returns {object} - { success, postId, error }
 */
async function postToInstagram(imageUrlOrPath, caption, runtimeConfig = null) {
  const blotatoCfg = getBlotatoConfig(runtimeConfig);

  if (!blotatoCfg.apiKey) {
    console.warn('⚠️  BLOTATO_API_KEY not configured');
    return { success: false, error: 'BLOTATO_API_KEY not configured' };
  }

  try {
    let mediaUrl = imageUrlOrPath;
    if (!imageUrlOrPath.startsWith('http')) {
      mediaUrl = await uploadMedia(imageUrlOrPath, blotatoCfg);
    }

    const igCaption = truncateHashtagsForInstagram(caption);
    const response = await axios.post(
      `${blotatoCfg.baseUrl}/posts`,
      {
        post: {
          accountId: blotatoCfg.igAccountId,
          content: {
            text: igCaption,
            mediaUrls: [mediaUrl],
            platform: 'instagram',
          },
          target: {
            targetType: 'instagram',
          },
        },
      },
      {
        headers: {
          'blotato-api-key': blotatoCfg.apiKey,
          'Content-Type': 'application/json',
        },
      }
    );

    const postSubmissionId = response.data.postSubmissionId || response.data.id;
    console.log('Instagram post submitted:', postSubmissionId);
    return { success: true, postId: postSubmissionId };
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.error('Instagram posting error:', { status, body, message: error.message });
    const errMsg = body?.message || body?.error || error.message;
    return { success: false, error: errMsg };
  }
}

/**
 * Post video (Reel) to Instagram via Blotato
 * @param {string} videoUrlOrPath - Public URL or local file path of the video
 * @param {string} caption - Post caption
 * @param {object} runtimeConfig - Optional runtime config override
 * @returns {object} - { success, postId, error }
 */
async function postReelToInstagram(videoUrlOrPath, caption, runtimeConfig = null) {
  const blotatoCfg = getBlotatoConfig(runtimeConfig);

  if (!blotatoCfg.apiKey) {
    return { success: false, error: 'BLOTATO_API_KEY not configured' };
  }

  try {
    let mediaUrl = videoUrlOrPath;
    if (!videoUrlOrPath.startsWith('http')) {
      mediaUrl = await uploadMedia(videoUrlOrPath, blotatoCfg);
    }

    const igCaption = truncateHashtagsForInstagram(caption);
    const response = await axios.post(
      `${blotatoCfg.baseUrl}/posts`,
      {
        post: {
          accountId: blotatoCfg.igAccountId,
          content: {
            text: igCaption,
            mediaUrls: [mediaUrl],
            platform: 'instagram',
          },
          target: {
            targetType: 'instagram',
          },
        },
      },
      {
        headers: {
          'blotato-api-key': blotatoCfg.apiKey,
          'Content-Type': 'application/json',
        },
        timeout: 120000,
      }
    );

    const postSubmissionId = response.data.postSubmissionId || response.data.id;
    console.log('Instagram Reel submitted:', postSubmissionId);
    return { success: true, postId: postSubmissionId };
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.error('Instagram Reel posting error:', { status, body, message: error.message });
    const errMsg = body?.message || body?.error || error.message;
    return { success: false, error: errMsg };
  }
}

module.exports = { postToInstagram, postReelToInstagram };
