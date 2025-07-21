const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller.js');
const verifyToken = require('../middlewares/auth.middleware.js');

// 이벤트 라우트 설정

// 1. 새 이벤트 생성 (로그인 필요)
router.post('/', verifyToken, eventController.create);

// 2. 지도 범위 내 모든 이벤트 조회
router.get('/', eventController.findAll);

// 3. 특정 이벤트 상세 조회
router.get('/:eventId', eventController.findOne);

// 4. 이벤트 '좋아요' 추가 (로그인 필요)
router.post('/:eventId/like', verifyToken, eventController.likeEvent);

// 5. 이벤트 '좋아요' 취소 (로그인 필요)
router.delete('/:eventId/like', verifyToken, eventController.unlikeEvent);

// 6. 이벤트 수정 (로그인 필요)
router.put('/:eventId', verifyToken, eventController.updateEvent);

// 7. 이벤트 삭제 (로그인 필요)
router.delete('/:eventId', verifyToken, eventController.deleteEvent);


module.exports = router; 