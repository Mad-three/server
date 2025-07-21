const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller.js');
// 검색 API는 로그인이 필수가 아니지만, 로그인했다면 더 정확한 정보를 주기 위해
// 토큰을 검증하되, 없어도 통과시키는 새로운 미들웨어가 필요합니다.
// 일단은 미들웨어 없이 진행하고, 추후 'isLiked' 정보가 필요할 때 미들웨어를 추가할 수 있습니다.

// 이벤트 검색 라우트
router.get('/events', searchController.searchEvents);

module.exports = router; 