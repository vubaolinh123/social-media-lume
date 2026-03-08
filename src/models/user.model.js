const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  passwordHash: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'admin',
  },
  settings: {
    ai: {
      apiKey: { type: String, default: '' },
      imageModel: { type: String, default: '' },
      textModel: { type: String, default: '' },
    },
    social: {
      facebookPageAccessToken: { type: String, default: '' },
      instagramAccessToken: { type: String, default: '' },
      telegramBotToken: { type: String, default: '' },
      telegramChatId: { type: String, default: '' },
    },
    brand: {
      name: { type: String, default: '' },
      handle: { type: String, default: '' },
      tagline: { type: String, default: '' },
      website: { type: String, default: '' },
      address: { type: String, default: '' },
      phone: { type: String, default: '' },
      hotline: { type: String, default: '' },
    },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
