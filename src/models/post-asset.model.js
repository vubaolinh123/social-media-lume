const mongoose = require('mongoose');

const publishChannelSchema = new mongoose.Schema({
  success: { type: Boolean, default: false },
  skipped: { type: Boolean, default: false },
  postId: { type: String, default: null },
  error: { type: String, default: null },
  publishedAt: { type: Date, default: null },
}, { _id: false });

const postAssetSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  postType: {
    type: String,
    required: true,
    enum: ['BA', 'Review', 'BTS', 'Promo', 'Spotlight'],
  },
  title: { type: String, default: '' },
  content: { type: String, default: '' },
  caption: { type: String, default: '' },
  shortCaption: { type: String, default: '' },
  hashtags: { type: [String], default: [] },

  originalFilePath: { type: String, required: true },
  originalFilename: { type: String, required: true },
  generatedFilePath: { type: String, default: null },
  generatedFilename: { type: String, default: null },

  aiGenerated: { type: Boolean, default: false },
  aiError: { type: String, default: null },
  aiErrorType: { type: String, default: null },
  modelError: { type: String, default: null },
  productAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
  similarityScore: { type: Number, default: null },
  generationAttempts: { type: Number, default: 0 },
  generationStatus: {
    type: String,
    enum: ['pending', 'processing', 'success', 'failed', 'similarity_failed'],
    default: 'pending',
  },
  requestedImageModel: { type: String, default: null },
  requestedTextModel: { type: String, default: null },
  includeFooterContact: { type: Boolean, default: true },

  isVideo: { type: Boolean, default: false },
  logoPosition: { type: String, default: 'bottom-left' },
  qrPosition: { type: String, default: 'bottom-right' },

  publishStatus: {
    status: {
      type: String,
      enum: ['pending', 'published', 'created_only', 'failed', 'cancelled'],
      default: 'pending',
    },
    facebook: { type: publishChannelSchema, default: () => ({}) },
    instagram: { type: publishChannelSchema, default: () => ({}) },
    warnings: { type: [String], default: [] },
    approvalAction: { type: String, default: null },
    message: { type: String, default: null },
  },
}, {
  timestamps: true,
});

module.exports = mongoose.models.PostAsset || mongoose.model('PostAsset', postAssetSchema);
