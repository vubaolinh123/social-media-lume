const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth.middleware');
const streamController = require('../controllers/stream.controller');

router.get('/api/stream/posts', requireAuth, streamController.streamPostEvents);

module.exports = router;
