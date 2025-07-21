const db = require('../models');
const Review = db.Review;
const Event = db.Event;
const User = db.User;

// 1. 특정 이벤트에 대한 새 후기 생성 (POST /api/events/:eventId/reviews)
exports.create = async (req, res) => {
  const { eventId } = req.params;
  const { content, rating } = req.body;
  const { userId } = req.user; // 미들웨어에서 검증된 사용자 정보 사용

  // 유효성 검사
  if (!content || rating === undefined) {
    return res.status(400).send({ message: "후기 내용과 별점을 모두 입력해주세요." });
  }

  try {
    // 해당 이벤트가 실제로 존재하는지 확인
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).send({ message: "후기를 작성할 이벤트를 찾을 수 없습니다." });
    }

    // 후기 생성 (+ eventId 포함)
    const newReview = await Review.create({
      content,
      rating,
      eventId: event.eventId, // eventId를 명시적으로 설정
      userId: userId, // 토큰에서 추출한 userId 사용
    });

    res.status(201).send(newReview);
  } catch (error) {
    // 별점 범위(1~5) 오류 등 Sequelize 유효성 검사 에러 처리
    if (error.name === 'SequelizeValidationError') {
      return res.status(400).send({ message: error.errors[0].message });
    }
    res.status(500).send({
      message: error.message || "후기를 생성하는 동안 에러가 발생했습니다."
    });
  }
};

// 2. 특정 이벤트의 모든 후기 조회 (GET /api/events/:eventId/reviews)
exports.findAll = async (req, res) => {
  const { eventId } = req.params;

  try {
    // 해당 이벤트가 실제로 존재하는지 확인
     const event = await Event.findByPk(eventId);
     if (!event) {
       return res.status(404).send({ message: "후기를 조회할 이벤트를 찾을 수 없습니다." });
     }

    const reviews = await Review.findAll({
      where: { eventId: eventId },
      include: [{ // 작성자 정보 포함
        model: User,
        attributes: ['userId', 'name']
      }]
    });

    res.status(200).send(reviews);
  } catch (error) {
    res.status(500).send({
      message: error.message || "후기를 조회하는 동안 에러가 발생했습니다."
    });
  }
};

// 3. 후기 수정 (PUT /api/reviews/:reviewId)
exports.updateReview = async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.user;
  const { content, rating } = req.body;

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).send({ message: "수정할 후기를 찾을 수 없습니다." });
    }

    // 권한 검사
    if (review.userId !== userId) {
      return res.status(403).send({ message: "후기를 수정할 권한이 없습니다." });
    }

    await review.update({ content, rating });
    res.status(200).send({ message: "후기가 성공적으로 수정되었습니다." });
  } catch (error) {
    res.status(500).send({ message: "후기 수정 중 에러가 발생했습니다." });
  }
};

// 4. 후기 삭제 (DELETE /api/reviews/:reviewId)
exports.deleteReview = async (req, res) => {
  const { reviewId } = req.params;
  const { userId } = req.user;

  try {
    const review = await Review.findByPk(reviewId);
    if (!review) {
      return res.status(404).send({ message: "삭제할 후기를 찾을 수 없습니다." });
    }

    // 권한 검사
    if (review.userId !== userId) {
      return res.status(403).send({ message: "후기를 삭제할 권한이 없습니다." });
    }

    await review.destroy();
    res.status(200).send({ message: "후기가 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).send({ message: "후기 삭제 중 에러가 발생했습니다." });
  }
}; 