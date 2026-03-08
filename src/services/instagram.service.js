/**
 * Instagram Service
 * Handles posting to Instagram via Facebook Graph API (Instagram Content Publishing API)
 * Instagram Business Account ID is auto-fetched from the Facebook Page Access Token
 */

const axios = require('axios');
const config = require('../config');

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

// Cache Instagram Account ID after first fetch
let cachedInstagramAccountId = null;

function getAccessToken(runtimeConfig) {
  return runtimeConfig?.facebook?.pageAccessToken || config.facebook.pageAccessToken;
}

/**
 * Fetch Instagram Business Account ID from the Facebook Page Access Token
 * Uses GET /me?fields=instagram_business_account to find the linked IG account
 * @returns {string|null} - Instagram Account ID or null
 */
async function fetchInstagramAccountId(runtimeConfig = null) {
  if (cachedInstagramAccountId) return cachedInstagramAccountId;

  const accessToken = getAccessToken(runtimeConfig);
  if (!accessToken) {
    console.warn('⚠️  FACEBOOK_PAGE_ACCESS_TOKEN not configured (needed for Instagram)');
    return null;
  }

  try {
    const response = await axios.get(`${GRAPH_API_URL}/me`, {
      params: {
        access_token: accessToken,
        fields: 'instagram_business_account,name',
      },
    });

    const igAccount = response.data.instagram_business_account;
    if (!igAccount || !igAccount.id) {
      console.warn('⚠️  No Instagram Business Account linked to this Facebook Page.');
      console.warn('    Make sure your Facebook Page is connected to an Instagram Professional account.');
      return null;
    }

    cachedInstagramAccountId = igAccount.id;
    console.log(`✅ Instagram Business Account detected: ${cachedInstagramAccountId} (from Page: "${response.data.name}")`);
    return cachedInstagramAccountId;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Failed to fetch Instagram Account ID:', errMsg);
    return null;
  }
}

/**
 * Post image + caption to Instagram
 * Instagram requires a public URL for the image, so we need to either:
 * 1. Upload to a temporary hosting
 * 2. Use the Facebook page photo URL after posting to Facebook
 * 
 * @param {string} imageUrl - Public URL of the image
 * @param {string} caption - Post caption
 * @returns {object} - { success, postId, error }
 */
async function postToInstagram(imageUrl, caption, runtimeConfig = null) {
  const accessToken = getAccessToken(runtimeConfig);
  if (!accessToken) {
    console.warn('⚠️  Instagram credentials not configured');
    return { success: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured (needed for Instagram)' };
  }

  const accountId = await fetchInstagramAccountId(runtimeConfig);
  if (!accountId) {
    return { success: false, error: 'Could not determine Instagram Business Account ID. Make sure your Facebook Page is linked to an Instagram Professional account.' };
  }

  try {
    // Step 1: Create media container
    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${accountId}/media`,
      {
        image_url: imageUrl,
        caption: caption,
        access_token: accessToken,
      }
    );

    const containerId = containerResponse.data.id;
    console.log('📦 Instagram media container created:', containerId);

    // Step 2: Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Step 3: Publish the container
    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${accountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken,
      }
    );

    console.log('✅ Instagram post published:', publishResponse.data.id);
    return {
      success: true,
      postId: publishResponse.data.id,
    };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Instagram posting error:', errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Post video (Reels) to Instagram
 * @param {string} videoUrl - Public URL of the video
 * @param {string} caption - Post caption
 * @returns {object}
 */
async function postReelToInstagram(videoUrl, caption, runtimeConfig = null) {
  const accessToken = getAccessToken(runtimeConfig);
  if (!accessToken) {
    return { success: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured (needed for Instagram)' };
  }

  const accountId = await fetchInstagramAccountId(runtimeConfig);
  if (!accountId) {
    return { success: false, error: 'Could not determine Instagram Business Account ID. Make sure your Facebook Page is linked to an Instagram Professional account.' };
  }

  try {
    // Step 1: Create Reel container
    const containerResponse = await axios.post(
      `${GRAPH_API_URL}/${accountId}/media`,
      {
        video_url: videoUrl,
        caption: caption,
        media_type: 'REELS',
        access_token: accessToken,
      }
    );

    const containerId = containerResponse.data.id;

    // Step 2: Wait for video processing
    let status = 'IN_PROGRESS';
    let retries = 0;
    while (status === 'IN_PROGRESS' && retries < 30) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      const statusResponse = await axios.get(
        `${GRAPH_API_URL}/${containerId}`,
        { params: { fields: 'status_code', access_token: accessToken } }
      );
      status = statusResponse.data.status_code;
      retries++;
    }

    if (status !== 'FINISHED') {
      return { success: false, error: `Video processing failed with status: ${status}` };
    }

    // Step 3: Publish
    const publishResponse = await axios.post(
      `${GRAPH_API_URL}/${accountId}/media_publish`,
      {
        creation_id: containerId,
        access_token: accessToken,
      }
    );

    console.log('✅ Instagram Reel published:', publishResponse.data.id);
    return { success: true, postId: publishResponse.data.id };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Instagram Reel posting error:', errMsg);
    return { success: false, error: errMsg };
  }
}

module.exports = { postToInstagram, postReelToInstagram, fetchInstagramAccountId };
