const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settings.controller');
const { requireAuth } = require('../middleware/auth.middleware');

router.get('/settings', requireAuth, settingsController.showSettings);
router.post('/api/settings', requireAuth, settingsController.updateSettings);
router.post('/api/settings/test-connections', requireAuth, settingsController.testConnections);

module.exports = router;
