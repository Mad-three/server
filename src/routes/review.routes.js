const express = require('express');
// mergeParams: true 옵션은 상위 라우터의 파라미터(예: :eventId)를 하위 라우터에서 사용할 수 있게 해줍니다.
const router = express.Router({ mergeParams: true }); 
const reviewController = require('../controllers/review.controller.js');
const verifyToken = require('../middlewares/auth.middleware.js');

// 후기 라우트 설정 (상위 경로는 /api/events/:eventId/reviews)

// 1. 새 후기 생성 (로그인 필요)
router.post('/', verifyToken, reviewController.create);

// 2. 특정 이벤트의 모든 후기 조회
router.get('/', reviewController.findAll);

module.exports = router; 