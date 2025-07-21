const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/review.controller.js');
const verifyToken = require('../middlewares/auth.middleware.js');

// 최상위 후기 라우트 설정 (수정 및 삭제용)

// 1. 후기 수정 (로그인 필요)
router.put('/:reviewId', verifyToken, reviewController.updateReview);

// 2. 후기 삭제 (로그인 필요)
router.delete('/:reviewId', verifyToken, reviewController.deleteReview);

module.exports = router; 