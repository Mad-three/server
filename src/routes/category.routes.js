const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/category.controller.js');

// 카테고리 라우트 설정

// 1. 새로운 카테고리 생성 (POST /api/categories)
// 이 경로로 POST 요청이 오면 categoryController의 create 함수를 실행합니다.
router.post('/', categoryController.create);

// 2. 모든 카테고리 조회 (GET /api/categories)
// 이 경로로 GET 요청이 오면 categoryController의 findAll 함수를 실행합니다.
router.get('/', categoryController.findAll);

module.exports = router; 