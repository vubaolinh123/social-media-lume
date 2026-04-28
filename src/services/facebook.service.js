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

async function uploadMedia(filePath, blotatoCfg) {
  const filename = path.basename(filePath);

  // Step 1: request presigned upload URL
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

  // Step 2: PUT binary file to presigned URL
  const fileBuffer = fs.readFileSync(filePath);
  await axios.put(presignedUrl, fileBuffer, {
    headers: { 'Content-Type': getMimeType(filePath) },
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
  });

  return publicUrl;
}

/**
 * Post image + caption to Facebook Page via Blotato
 * @param {string} imagePath - Local path to the image file
 * @param {string} caption - Post caption text
 * @param {object} runtimeConfig - Optional runtime config override
 * @returns {object} - { success, postId, error }
 */
async function postToPage(imagePath, caption, runtimeConfig = null) {
  const blotatoCfg = getBlotatoConfig(runtimeConfig);

  if (!blotatoCfg.apiKey) {
    console.warn('⚠️  BLOTATO_API_KEY not configured');
    return { success: false, error: 'BLOTATO_API_KEY not configured' };
  }

  try {
    const mediaUrl = await uploadMedia(imagePath, blotatoCfg);

    const response = await axios.post(
      `${blotatoCfg.baseUrl}/posts`,
      {
        post: {
          accountId: blotatoCfg.fbAccountId,
          content: {
            text: caption,
            mediaUrls: [mediaUrl],
            platform: 'facebook',
          },
          target: {
            targetType: 'facebook',
            pageId: blotatoCfg.fbPageId,
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
    console.log('Facebook post submitted:', postSubmissionId);
    return { success: true, postId: postSubmissionId, mediaUrl };
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.error('Facebook posting error:', { status, body, message: error.message });
    const errMsg = body?.message || body?.error || error.message;
    return { success: false, error: errMsg };
  }
}

/**
 * Post video to Facebook Page via Blotato
 * @param {string} videoPath - Local path to the video file
 * @param {string} caption - Post caption
 * @param {object} runtimeConfig - Optional runtime config override
 * @returns {object} - { success, postId, error }
 */
async function postVideoToPage(videoPath, caption, runtimeConfig = null) {
  const blotatoCfg = getBlotatoConfig(runtimeConfig);

  if (!blotatoCfg.apiKey) {
    return { success: false, error: 'BLOTATO_API_KEY not configured' };
  }

  try {
    const mediaUrl = await uploadMedia(videoPath, blotatoCfg);

    const response = await axios.post(
      `${blotatoCfg.baseUrl}/posts`,
      {
        post: {
          accountId: blotatoCfg.fbAccountId,
          content: {
            text: caption,
            mediaUrls: [mediaUrl],
            platform: 'facebook',
          },
          target: {
            targetType: 'facebook',
            pageId: blotatoCfg.fbPageId,
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
    console.log('Facebook video submitted:', postSubmissionId);
    return { success: true, postId: postSubmissionId, mediaUrl };
  } catch (error) {
    const status = error.response?.status;
    const body = error.response?.data;
    console.error('Facebook video posting error:', { status, body, message: error.message });
    const errMsg = body?.message || body?.error || error.message;
    return { success: false, error: errMsg };
  }
}

module.exports = { postToPage, postVideoToPage };
