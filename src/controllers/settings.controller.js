const mongoose = require('mongoose');
const config = require('../config');
const User = require('../models/user.model');
const geminiService = require('../services/gemini.service');
const telegramService = require('../services/telegram.service');
const { buildRuntimeConfig, buildMaskedSettings } = require('../services/runtime-config.service');
const { encryptText } = require('../utils/crypto');

function parseOwnerId(req) {
  if (!req.user || !req.user.id || !mongoose.isValidObjectId(req.user.id)) return null;
  return req.user.id;
}

async function showSettings(req, res) {
  const ownerId = parseOwnerId(req);
  if (!ownerId) return res.redirect('/login');

  const user = await User.findById(ownerId).lean();

  res.render('settings', {
    brand: config.brand,
    user: req.user || null,
    settings: user?.settings || {},
    masked: buildMaskedSettings(user || {}),
    pageTitle: 'Cài đặt hệ thống - LUMÉ LASHES',
    success: null,
    error: null,
  });
}

async function updateSettings(req, res) {
  try {
    const ownerId = parseOwnerId(req);
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const existing = await User.findById(ownerId).lean();
    const prev = existing?.settings || {};

    const nextAiKey = (req.body.geminiApiKey || '').trim();
    const nextTg = (req.body.telegramBotToken || '').trim();

    const payload = {
      settings: {
        ai: {
          apiKey: nextAiKey ? encryptText(nextAiKey) : (prev.ai?.apiKey || ''),
          imageModel: prev.ai?.imageModel || '',
          textModel: prev.ai?.textModel || '',
        },
        social: {
          telegramBotToken: nextTg ? encryptText(nextTg) : (prev.social?.telegramBotToken || ''),
          telegramChatId: req.body.telegramChatId || '',
        },
        brand: {
          name: req.body.brandName || '',
          tagline: req.body.brandTagline || '',
          website: req.body.brandWebsite || '',
          address: req.body.brandAddress || '',
          phone: req.body.brandPhone || '',
          hotline: req.body.brandHotline || '',
        },
      },
    };

    // preserve model settings from existing user profile (managed elsewhere via header modal)
    if (typeof prev.ai?.imageModel === 'string') {
      payload.settings.ai.imageModel = prev.ai.imageModel;
    }
    if (typeof prev.ai?.textModel === 'string') {
      payload.settings.ai.textModel = prev.ai.textModel;
    }

    await User.findByIdAndUpdate(ownerId, { $set: payload }, { new: true, upsert: false });

    return res.json({ success: true, message: 'Đã cập nhật cài đặt thành công' });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

async function testConnections(req, res) {
  try {
    const ownerId = parseOwnerId(req);
    if (!ownerId) return res.status(401).json({ success: false, message: 'Unauthorized' });

    const user = await User.findById(ownerId);
    const runtimeConfig = buildRuntimeConfig(user);

    const checks = {
      gemini: false,
      facebook: false,
      instagram: false,
      telegram: false,
    };

    // Gemini
    try {
      const models = await geminiService.listModels(runtimeConfig.gemini);
      checks.gemini = Array.isArray(models) && models.length > 0;
    } catch (error) {
      checks.gemini = false;
    }

    // Facebook & Instagram — both gate on Blotato API key
    checks.facebook = !!runtimeConfig.blotato?.apiKey;
    checks.instagram = !!runtimeConfig.blotato?.apiKey;

    // Telegram
    try {
      checks.telegram = !!(runtimeConfig.telegram.botToken && runtimeConfig.telegram.chatId && telegramService.init());
    } catch (error) {
      checks.telegram = false;
    }

    return res.json({ success: true, checks });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
}

module.exports = {
  showSettings,
  updateSettings,
  testConnections,
};
