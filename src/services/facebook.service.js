/**
 * Facebook Service
 * Handles posting to Facebook Page via Graph API
 * Page ID is auto-fetched from the Page Access Token (no need to configure manually)
 */

const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const config = require('../config');

const GRAPH_API_URL = 'https://graph.facebook.com/v21.0';

// Cache Page ID by token (avoids repeated API calls)
const pageIdCache = new Map();

function getPageAccessToken(runtimeConfig) {
  return runtimeConfig?.facebook?.pageAccessToken || config.facebook.pageAccessToken;
}

/**
 * Fetch Facebook Page ID from the Page Access Token
 * Uses GET /me endpoint which returns the page info associated with the token
 * @returns {string|null} - Page ID or null on failure
 */
async function fetchPageId(runtimeConfig = null) {
  const accessToken = getPageAccessToken(runtimeConfig);
  if (pageIdCache.has(accessToken)) return pageIdCache.get(accessToken);

  if (!accessToken) {
    console.warn('⚠️  FACEBOOK_PAGE_ACCESS_TOKEN not configured');
    return null;
  }

  try {
    const response = await axios.get(`${GRAPH_API_URL}/me`, {
      params: {
        access_token: accessToken,
        fields: 'id,name',
      },
    });

    pageIdCache.set(accessToken, response.data.id);
    console.log(`✅ Facebook Page detected: "${response.data.name}" (ID: ${response.data.id})`);
    return response.data.id;
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Failed to fetch Facebook Page ID from token:', errMsg);
    return null;
  }
}

/**
 * Post image + caption to Facebook Page
 * @param {string} imagePath - Path to the processed image
 * @param {string} caption - Post caption text
 * @returns {object} - { success, postId, error }
 */
async function postToPage(imagePath, caption, runtimeConfig = null) {
  const accessToken = getPageAccessToken(runtimeConfig);

  if (!accessToken) {
    console.warn('⚠️  Facebook credentials not configured');
    return { success: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured' };
  }

  const pageId = await fetchPageId(runtimeConfig);
  if (!pageId) {
    return { success: false, error: 'Could not determine Facebook Page ID from token. Please check your FACEBOOK_PAGE_ACCESS_TOKEN.' };
  }

  try {
    const form = new FormData();
    form.append('source', fs.createReadStream(imagePath));
    form.append('message', caption);
    form.append('access_token', accessToken);

    const response = await axios.post(
      `${GRAPH_API_URL}/${pageId}/photos`,
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      }
    );

    console.log('✅ Facebook post created:', response.data.id);
    return {
      success: true,
      postId: response.data.id,
    };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Facebook posting error:', errMsg);
    return {
      success: false,
      error: errMsg,
    };
  }
}

/**
 * Post video to Facebook Page
 * @param {string} videoPath - Path to video file
 * @param {string} caption - Post caption
 * @returns {object} - { success, postId, error }
 */
async function postVideoToPage(videoPath, caption, runtimeConfig = null) {
  const accessToken = getPageAccessToken(runtimeConfig);

  if (!accessToken) {
    return { success: false, error: 'FACEBOOK_PAGE_ACCESS_TOKEN not configured' };
  }

  const pageId = await fetchPageId(runtimeConfig);
  if (!pageId) {
    return { success: false, error: 'Could not determine Facebook Page ID from token. Please check your FACEBOOK_PAGE_ACCESS_TOKEN.' };
  }

  try {
    const form = new FormData();
    form.append('source', fs.createReadStream(videoPath));
    form.append('description', caption);
    form.append('access_token', accessToken);

    const response = await axios.post(
      `${GRAPH_API_URL}/${pageId}/videos`,
      form,
      {
        headers: form.getHeaders(),
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
        timeout: 120000,
      }
    );

    console.log('✅ Facebook video posted:', response.data.id);
    return { success: true, postId: response.data.id };
  } catch (error) {
    const errMsg = error.response?.data?.error?.message || error.message;
    console.error('❌ Facebook video posting error:', errMsg);
    return { success: false, error: errMsg };
  }
}

module.exports = { postToPage, postVideoToPage, fetchPageId };
