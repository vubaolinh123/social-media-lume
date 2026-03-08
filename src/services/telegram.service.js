/**
 * Telegram Service
 * Only Cancel button — if not pressed, auto-publish after timeout
 */

const TelegramBot = require('node-telegram-bot-api');
const fs = require('fs');
const config = require('../config');

let bot = null;
let botTokenRef = null;
const pendingApprovals = new Map();

function getTelegramRuntime(runtimeConfig = null) {
  return {
    botToken: runtimeConfig?.telegram?.botToken || config.telegram.botToken,
    chatId: runtimeConfig?.telegram?.chatId || config.telegram.chatId,
    autoPublishDelay: runtimeConfig?.telegram?.autoPublishDelay || config.autoPublishDelay,
  };
}

function init(runtimeConfig = null) {
  const runtime = getTelegramRuntime(runtimeConfig);

  if (!runtime.botToken) {
    console.warn('⚠️  TELEGRAM_BOT_TOKEN not configured. Approval feature disabled.');
    return false;
  }

  if (bot && botTokenRef === runtime.botToken) {
    return true;
  }

  if (bot && botTokenRef && botTokenRef !== runtime.botToken) {
    try {
      bot.stopPolling();
    } catch (e) {
      // ignore
    }
  }

  bot = new TelegramBot(runtime.botToken, { polling: true });
  botTokenRef = runtime.botToken;

  // Handle callback queries (button presses)
  bot.on('callback_query', async (query) => {
    const messageId = query.message.message_id;
    const action = query.data;

    const pending = pendingApprovals.get(messageId);
    if (!pending) {
      await bot.answerCallbackQuery(query.id, { text: 'Bài viết này đã được xử lý.' });
      return;
    }

    if (action === 'cancel') {
      clearTimeout(pending.timeout);
      pendingApprovals.delete(messageId);

      await bot.answerCallbackQuery(query.id, { text: '❌ Đã huỷ đăng bài.' });
      await bot.editMessageReplyMarkup(
        { inline_keyboard: [[{ text: '❌ ĐÃ HUỶ', callback_data: 'done' }]] },
        { chat_id: pending.chatId, message_id: messageId }
      );
      pending.resolve({ approved: false, action: 'cancelled' });
    }
  });

  console.log('🤖 Telegram bot initialized');
  return true;
}

/**
 * Send post to Telegram with only a Cancel button.
 * If no cancel within timeout → auto-publish.
 */
async function sendForApproval(imagePath, caption, postType) {
  const runtime = getTelegramRuntime();
  return sendForApprovalWithRuntime(imagePath, caption, postType, runtime);
}

async function sendForApprovalWithRuntime(imagePath, caption, postType, runtimeConfig = null) {
  const runtime = getTelegramRuntime(runtimeConfig);

  if (!bot && !init(runtimeConfig)) {
    console.warn('Telegram not configured, auto-approving');
    return { approved: true, action: 'auto_approved' };
  }

  if (!runtime.chatId) {
    console.warn('TELEGRAM_CHAT_ID not configured, auto-approving');
    return { approved: true, action: 'auto_approved' };
  }

  const typeLabels = {
    BA: 'Before/After',
    Review: 'Review khách',
    BTS: 'Behind The Scenes',
    Promo: 'Khuyến mãi',
    Spotlight: 'Client Spotlight',
    Tutorial: 'Tutorial',
    NewArrival: 'New Arrival',
    Seasonal: 'Seasonal / Holiday',
    Tips: 'Tips / Did You Know',
    Portfolio: 'Portfolio Showcase',
    AIRandom: 'AI Random Design',
  };

  const delayMinutes = Math.round(runtime.autoPublishDelay / 60);
  const message = `📋 *BÀI VIẾT MỚI*\n\n📌 Loại: *${typeLabels[postType] || postType}*\n\n📝 *Caption:*\n${caption}\n\n⏰ _Tự động đăng sau ${delayMinutes} phút. Bấm Huỷ nếu không muốn đăng._`;

  try {
    const sentMessage = await bot.sendPhoto(
      runtime.chatId,
      fs.createReadStream(imagePath),
      {
        caption: message.substring(0, 1024),
        parse_mode: 'Markdown',
        reply_markup: {
          inline_keyboard: [
            [{ text: '❌ Huỷ — Không đăng bài này', callback_data: 'cancel' }],
          ],
        },
      }
    );

    // Send full caption if truncated
    if (message.length > 1024) {
      await bot.sendMessage(runtime.chatId, message, { parse_mode: 'Markdown' });
    }

    return new Promise((resolve) => {
      const timeout = setTimeout(() => {
        pendingApprovals.delete(sentMessage.message_id);
        bot.editMessageReplyMarkup(
          { inline_keyboard: [[{ text: '✅ ĐÃ TỰ ĐỘNG ĐĂNG', callback_data: 'done' }]] },
          { chat_id: runtime.chatId, message_id: sentMessage.message_id }
        ).catch(() => {});
        resolve({ approved: true, action: 'auto_published' });
      }, runtime.autoPublishDelay * 1000);

      pendingApprovals.set(sentMessage.message_id, {
        resolve,
        timeout,
        chatId: runtime.chatId,
        data: { caption, postType },
      });
    });
  } catch (error) {
    console.error('❌ Telegram error:', error.message);
    return { approved: true, action: 'auto_approved_error' };
  }
}

init();

module.exports = { sendForApproval, sendForApprovalWithRuntime, init };
