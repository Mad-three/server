const db = require('../models');
const Category = db.Category;

// 1. 새로운 카테고리 생성 (POST /api/categories)
exports.create = async (req, res) => {
  // 요청 본문(request body)에서 name을 가져옴
  const { name } = req.body;

  // 이름이 없는 경우, 400 Bad Request 응답 전송
  if (!name) {
    return res.status(400).send({
      message: "카테고리 이름은 비어있을 수 없습니다."
    });
  }

  try {
    // Category 모델을 사용하여 DB에 새로운 카테고리 생성
    const newCategory = await Category.create({ name });
    // 성공 시, 201 Created 응답과 함께 생성된 카테고리 정보 전송
    res.status(201).send(newCategory);
  } catch (error) {
    // 에러 발생 시, 500 Internal Server Error 응답 전송
    res.status(500).send({
      message: error.message || "카테고리를 생성하는 동안 에러가 발생했습니다."
    });
  }
};

// 2. 모든 카테고리 조회 (GET /api/categories)
exports.findAll = async (req, res) => {
  try {
    // DB에 있는 모든 카테고리를 조회
    const categories = await Category.findAll();
    // 성공 시, 200 OK 응답과 함께 카테고리 목록 전송
    res.status(200).send(categories);
  } catch (error) {
    // 에러 발생 시, 500 Internal Server Error 응답 전송
    res.status(500).send({
      message: error.message || "카테고리를 조회하는 동안 에러가 발생했습니다."
    });
  }
}; 