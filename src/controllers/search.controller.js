const db = require('../models');
const { Op } = require('sequelize');
const sequelize = db.sequelize;

// 1. 키워드로 이벤트 검색 (GET /api/search/events?query=...)
exports.searchEvents = async (req, res) => {
  const { query, sortBy = 'latest', page = 1, limit = 10 } = req.query;
  const loggedInUserId = req.user ? req.user.userId : null;

  if (!query) {
    return res.status(400).send({ message: "검색어가 필요합니다." });
  }

  const offset = (page - 1) * limit;
  let order;

  // 정렬 기준 설정
  if (sortBy === 'likes') {
    order = [[sequelize.literal('likeCount'), 'DESC']];
  } else {
    order = [['createdAt', 'DESC']]; // 기본값: 최신순
  }

  try {
    const { count, rows } = await db.Event.findAndCountAll({
      where: {
        [Op.or]: [
          { title: { [Op.like]: `%${query}%` } },
          { description: { [Op.like]: `%${query}%` } },
        ]
      },
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
        { model: db.Category, attributes: ['categoryId', 'name'], through: { attributes: [] } },
        { model: db.User, as: 'Author', attributes: ['userId', 'name'] }
      ],
      order,
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      distinct: true, // COUNT가 정확하게 계산되도록 보장
    });

    res.status(200).send({
      pagination: {
        totalItems: count,
        totalPages: Math.ceil(count / limit),
        currentPage: parseInt(page, 10),
      },
      events: rows,
    });
  } catch (error) {
    // 👇 이 코드가 Render 로그에 에러의 상세 내용을 출력합니다.
    console.error("이벤트 검색 중 에러가 발생했습니다.", error);
    res.status(500).send({
      message: "이벤트 검색 중 에러가 발생했습니다."
    });
  }
}; 