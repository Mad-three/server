const express = require('express');
const router = express.Router();
const mapController = require('../controllers/map.controller');
// const authMiddleware = require('../middlewares/auth.middleware'); // 필요시 인증 미들웨어 추가

// 주소를 위도/경도로 변환하는 API
// 예: GET /api/maps/geocode?address=서울시청
router.get('/geocode', mapController.getCoordsFromAddress);

module.exports = router;