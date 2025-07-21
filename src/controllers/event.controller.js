const db = require('../models');
const { Op } = require('sequelize'); // 연산자(Operator) 불러오기
const sequelize = require('../models/index').sequelize;

const Event = db.Event;
const Category = db.Category;
const User = db.User;

// 1. 새 이벤트 생성 (POST /api/events)
exports.create = async (req, res) => {
  // 미들웨어에서 검증된 사용자 정보 사용
  const { userId } = req.user;

  const {
    title,
    description,
    imageUrl,
    startAt,
    endAt,
    longitude,
    latitude,
    location,
    categoryIds,
  } = req.body;

  // 필수 항목 유효성 검사
  if (!title || !startAt || !endAt || !longitude || !latitude) {
    return res.status(400).send({ message: "필수 항목을 모두 입력해주세요." });
  }

  // categoryIds가 배열인지, 비어있지 않은지 확인
  if (!categoryIds || !Array.isArray(categoryIds) || categoryIds.length === 0) {
    return res.status(400).send({ message: "하나 이상의 카테고리를 선택해야 합니다." });
  }


  try {
    // 1. 이벤트 생성
    const newEvent = await Event.create({
      title,
      description,
      imageUrl,
      startAt,
      endAt,
      longitude,
      latitude,
      location,
      userId,   // 토큰에서 추출한 userId 사용
    });

    // 2. 전달받은 categoryIds로 카테고리들을 찾음
    const categories = await Category.findAll({
      where: {
        categoryId: {
          [Op.in]: categoryIds,
        },
      },
    });

    // 3. 생성된 이벤트와 찾아낸 카테고리들을 연결 (EventCategory 테이블에 기록)
    await newEvent.setCategories(categories);

    // 4. 성공 응답 전송
    res.status(201).send(newEvent);

  } catch (error) {
    res.status(500).send({
      message: error.message || "이벤트를 생성하는 동안 에러가 발생했습니다."
    });
  }
};

// 2. 모든 이벤트 조회 (GET /api/events)
exports.findAll = async (req, res) => {
  const loggedInUserId = req.user ? req.user.userId : null;

  try {
    const events = await Event.findAll({
      attributes: [
        'eventId', 'title', 'startAt', 'longitude', 'latitude',
        [
          sequelize.literal(`(SELECT COUNT(*) FROM Likes WHERE Likes.eventId = Event.eventId)`),
          'likeCount'
        ],
        loggedInUserId ? [
          sequelize.literal(`(EXISTS (SELECT 1 FROM Likes WHERE Likes.eventId = Event.eventId AND Likes.userId = ${loggedInUserId}))`),
          'isLiked'
        ] : [sequelize.literal('false'), 'isLiked']
      ],
      include: [
        {
          model: Category,
          attributes: ['categoryId', 'name'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'Author',
          attributes: ['userId', 'name']
        }
      ],
    });
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({
      message: error.message || "이벤트를 조회하는 동안 에러가 발생했습니다."
    });
  }
};

// 3. 특정 이벤트 상세 조회 (GET /api/events/:eventId)
exports.findOne = async (req, res) => {
  const { eventId } = req.params;
  const loggedInUserId = req.user ? req.user.userId : null;

  try {
    const event = await Event.findByPk(eventId, {
      attributes: {
        include: [
          [
            sequelize.literal(`(SELECT COUNT(*) FROM Likes WHERE Likes.eventId = Event.eventId)`),
            'likeCount'
          ],
          loggedInUserId ? [
            sequelize.literal(`(EXISTS (SELECT 1 FROM Likes WHERE Likes.eventId = Event.eventId AND Likes.userId = ${loggedInUserId}))`),
            'isLiked'
          ] : [sequelize.literal('false'), 'isLiked']
        ]
      },
      include: [
        {
          model: Category,
          attributes: ['categoryId', 'name'],
          through: { attributes: [] }
        },
        {
          model: User,
          as: 'Author',
          attributes: ['userId', 'name', 'email'] // 작성자 이메일도 포함
        },
        {
          model: db.Review, // 후기 목록 포함
          include: {
            model: User, // 후기 작성자 정보 포함
            attributes: ['userId', 'name']
          },
          order: [['createdAt', 'DESC']]
        }
      ]
    });

    if (event) {
      res.status(200).send(event);
    } else {
      res.status(404).send({ message: "해당 이벤트를 찾을 수 없습니다." });
    }
  } catch (error) {
    res.status(500).send({
      message: "이벤트를 조회하는 동안 에러가 발생했습니다."
    });
  }
};

// 4. 이벤트 '좋아요' 추가 (POST /api/events/:eventId/like)
exports.likeEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user; // 인증된 사용자 ID

  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).send({ message: "이벤트를 찾을 수 없습니다." });
    }

    // 사용자와 이벤트를 Likes 테이블에 추가 (이미 있으면 무시)
    await event.addLikingUsers(userId);

    res.status(200).send({ message: "좋아요를 눌렀습니다." });
  } catch (error) {
    res.status(500).send({
      message: "좋아요 처리 중 에러가 발생했습니다."
    });
  }
};

// 5. 이벤트 '좋아요' 취소 (DELETE /api/events/:eventId/like)
exports.unlikeEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).send({ message: "이벤트를 찾을 수 없습니다." });
    }

    // Likes 테이블에서 해당 관계 제거
    await event.removeLikingUsers(userId);

    res.status(200).send({ message: "좋아요를 취소했습니다." });
  } catch (error) {
    res.status(500).send({
      message: "좋아요 취소 처리 중 에러가 발생했습니다."
    });
  }
};

// 6. 이벤트 수정 (PUT /api/events/:eventId)
exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).send({ message: "수정할 이벤트를 찾을 수 없습니다." });
    }

    // 권한 검사: 로그인한 사용자가 이벤트 작성자인지 확인
    if (event.userId !== userId) {
      return res.status(403).send({ message: "이벤트를 수정할 권한이 없습니다." });
    }

    // 이벤트 정보 업데이트
    await event.update(req.body);

    // 카테고리 정보가 있다면 업데이트
    if (req.body.categoryIds) {
      const categories = await Category.findAll({ where: { categoryId: { [Op.in]: req.body.categoryIds } } });
      await event.setCategories(categories);
    }

    res.status(200).send({ message: "이벤트가 성공적으로 수정되었습니다." });
  } catch (error) {
    res.status(500).send({ message: "이벤트 수정 중 에러가 발생했습니다." });
  }
};

// 7. 이벤트 삭제 (DELETE /api/events/:eventId)
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).send({ message: "삭제할 이벤트를 찾을 수 없습니다." });
    }

    // 권한 검사
    if (event.userId !== userId) {
      return res.status(403).send({ message: "이벤트를 삭제할 권한이 없습니다." });
    }

    await event.destroy();

    res.status(200).send({ message: "이벤트가 성공적으로 삭제되었습니다." });
  } catch (error) {
    res.status(500).send({ message: "이벤트 삭제 중 에러가 발생했습니다." });
  }
}; 