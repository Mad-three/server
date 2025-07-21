const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller.js');

// 네이버 로그인 콜백 처리 라우트
router.post('/naver/callback', authController.naverLogin);

module.exports = router; 