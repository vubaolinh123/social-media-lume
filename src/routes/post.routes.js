/**
 * Post Routes
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const config = require('../config');
const { generateFilename, getFileExt } = require('../utils/helpers');
const postController = require('../controllers/post.controller');
const { requireAuth } = require('../middleware/auth.middleware');

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, config.paths.uploads);
  },
  filename: (req, file, cb) => {
    const ext = getFileExt(file.originalname);
    cb(null, generateFilename(ext));
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp|mp4|mov|avi|mkv|webm/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype.split('/')[1]) || file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/');
    if (ext || mime) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, gif, webp) hoặc video (mp4, mov)'));
    }
  },
});

// Main form page
router.get('/', requireAuth, postController.showForm);

// Create post (upload + process)
router.post('/create', requireAuth, upload.single('media'), postController.createPost);

// Approve and publish post
router.post('/approve', requireAuth, postController.approvePost);

// Regenerate caption
router.post('/api/regenerate-caption', requireAuth, postController.regenerateCaption);

// Delete post asset (original + generated)
router.delete('/api/posts/:postId', requireAuth, postController.deletePostAsset);

// Poll generation status by post id
router.get('/api/posts/:postId/status', requireAuth, postController.getPostGenerationStatus);

// Service status check
router.get('/api/status', requireAuth, postController.checkStatus);

// List available Gemini models
router.get('/api/gemini-models', requireAuth, postController.listModels);

module.exports = router;
