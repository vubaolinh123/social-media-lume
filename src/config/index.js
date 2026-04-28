require('dotenv').config();

const config = {
  port: process.env.PORT || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',

  mongo: {
    uri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/lumi_lashes_social_media',
  },

  auth: {
    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
    jwtCookieName: process.env.JWT_COOKIE_NAME || 'lumi_token',
  },

  gemini: {
    apiKey: '',
    textModel: 'gemini-2.0-flash',
    imageModel: 'gemini-2.0-flash-exp-image-generation',
  },

  facebook: {
    pageAccessToken: '',
    // pageId is auto-fetched from token at runtime (no env needed)
  },

  instagram: {
    // accountId is auto-fetched from Facebook Page token at runtime (no env needed)
    // Instagram uses the same token as Facebook (Page Access Token)
  },

  blotato: {
    apiKey: process.env.BLOTATO_API_KEY || '',
    fbAccountId: process.env.BLOTATO_FB_ACCOUNT_ID || '',
    fbPageId: process.env.BLOTATO_FB_PAGE_ID || '',
    igAccountId: process.env.BLOTATO_IG_ACCOUNT_ID || '',
    baseUrl: 'https://backend.blotato.com/v2',
  },

  telegram: {
    botToken: '',
    chatId: '',
  },

  brand: {
    name: 'LUMÉ LASHES',
    handle: '@LUMILASHES.COM',
    hotline: '+17142096886',
    phone: '+17142096886',
    address: '244 Main street. Seal Beach. CA 90740',
    website: 'lumilashes.com',
    tagline: 'Nối Mi Đẹp Chuẩn Salon',
  },

  autoPublishDelay: parseInt(process.env.AUTO_PUBLISH_DELAY) || 300,

  paths: {
    uploads: 'public/uploads',
    output: 'public/output',
    assets: 'public/assets',
    logo: 'public/assets/logo.png',
    qr: 'public/assets/qr.png',
  },
};

module.exports = config;
