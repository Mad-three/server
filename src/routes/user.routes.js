const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller.js');
const verifyToken = require('../middlewares/auth.middleware.js');

// 내 정보 관련 라우트

// 1. 현재 로그인한 내 기본 정보 조회 (로그인 필요)
router.get('/me', verifyToken, userController.getMyInfo);

// 2. 내가 작성한 이벤트 목록 조회 (로그인 필요)
router.get('/me/events', verifyToken, userController.getMyAuthoredEvents);

// 3. 내가 '좋아요' 누른 이벤트 목록 조회 (로그인 필요)
router.get('/me/liked-events', verifyToken, userController.getMyLikedEvents);

// 4. 내가 작성한 후기 목록 조회 (로그인 필요)
router.get('/me/reviews', verifyToken, userController.getMyReviews);

// 5. 내 정보 수정 (로그인 필요)
router.put('/me', verifyToken, userController.updateMyInfo);

module.exports = router; 