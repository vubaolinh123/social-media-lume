const express = require('express');
const router = express.Router();
const galleryController = require('../controllers/gallery.controller');
const postController = require('../controllers/post.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/gallery', requireAuth, galleryController.showGallery);
router.get('/api/gallery', requireAuth, galleryController.listGalleryItems);

router.post('/api/posts/:postId/publish/facebook', requireAuth, galleryController.publishFacebook);
router.post('/api/posts/:postId/publish/instagram', requireAuth, galleryController.publishInstagram);
router.delete('/api/posts/:postId', requireAuth, postController.deletePostAsset);

module.exports = router;
