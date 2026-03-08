const config = require('../config');
const { decryptText, maskSecret } = require('../utils/crypto');

function pick(val, fallback = '') {
  if (typeof val === 'string' && val.trim()) return val.trim();
  return fallback;
}

function buildRuntimeConfig(userDoc) {
  const settings = userDoc?.settings || {};

  const brand = {
    ...config.brand,
    ...(settings.brand || {}),
  };

  return {
    gemini: {
      apiKey: pick(decryptText(settings.ai?.apiKey), config.gemini.apiKey),
      textModel: pick(settings.ai?.textModel, config.gemini.textModel),
      imageModel: pick(settings.ai?.imageModel, config.gemini.imageModel),
    },
    facebook: {
      pageAccessToken: pick(decryptText(settings.social?.facebookPageAccessToken), config.facebook.pageAccessToken),
    },
    instagram: {
      accessToken: pick(decryptText(settings.social?.instagramAccessToken), ''),
    },
    telegram: {
      botToken: pick(decryptText(settings.social?.telegramBotToken), config.telegram.botToken),
      chatId: pick(settings.social?.telegramChatId, config.telegram.chatId),
      autoPublishDelay: config.autoPublishDelay,
    },
    brand,
  };
}

function buildMaskedSettings(userDoc) {
  const settings = userDoc?.settings || {};
  return {
    ai: {
      apiKey: maskSecret(decryptText(settings.ai?.apiKey || '')),
      imageModel: settings.ai?.imageModel || '',
      textModel: settings.ai?.textModel || '',
    },
    social: {
      facebookPageAccessToken: maskSecret(decryptText(settings.social?.facebookPageAccessToken || '')),
      instagramAccessToken: maskSecret(decryptText(settings.social?.instagramAccessToken || '')),
      telegramBotToken: maskSecret(decryptText(settings.social?.telegramBotToken || '')),
      telegramChatId: settings.social?.telegramChatId || '',
    },
    brand: {
      ...(settings.brand || {}),
    },
  };
}

module.exports = {
  buildRuntimeConfig,
  buildMaskedSettings,
};
