const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller.js');
const verifyToken = require('../middlewares/auth.middleware.js');
const upload = require('../middlewares/upload.middleware.js');

// 하위 라우터 import
const reviewRoutes = require('./review.routes');

// '/:eventId/reviews' 경로에 대한 요청을 reviewRoutes로 전달
router.use('/:eventId/reviews', reviewRoutes);

// 이벤트 라우트 설정

// 1. 새 이벤트 생성 (로그인 필요)
router.post('/', upload.single('imageUrl'), verifyToken, eventController.create);

// 2. 지도 범위 내 모든 이벤트 조회
router.get('/', eventController.findAll);

// 3. 특정 이벤트 상세 조회
router.get('/:eventId', eventController.findOne);

// 4. 이벤트 '좋아요' 추가 (로그인 필요)
router.post('/:eventId/like', verifyToken, eventController.likeEvent);

// 5. 이벤트 '좋아요' 취소 (로그인 필요)
router.delete('/:eventId/like', verifyToken, eventController.unlikeEvent);

// 6. 이벤트 수정 (로그인 필요)
router.put('/:eventId', upload.single('imageUrl'), verifyToken, eventController.updateEvent);

// 7. 이벤트 삭제 (로그인 필요)
router.delete('/:eventId', verifyToken, eventController.deleteEvent);

// 네이버 캘린더에 일정 추가
router.post('/:eventId/add-to-naver-calendar', verifyToken, eventController.addEventToNaverCalendar);

module.exports = router; 