const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');

router.get('/login', authController.showLogin);
router.post('/auth/login', authController.loginLimiter, authController.login);
router.post('/auth/logout', authController.logout);

module.exports = router;
