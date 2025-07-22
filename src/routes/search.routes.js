const express = require('express');
const router = express.Router();
const searchController = require('../controllers/search.controller.js');

// 검색 라우트 설정

// 1. 키워드로 이벤트 검색 (예: /api/search?keyword=공연)
router.get('/', searchController.searchEvents);

// 2. 카테고리 ID로 이벤트 검색 (예: /api/search/category/3)
router.get('/category/:categoryId', searchController.searchByCategory);

module.exports = router; 