const db = require('../models');
const { Op } = require('sequelize'); // 연산자(Operator) 불러오기
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cryptoUtil = require('../utils/crypto.util');

const sequelize = db.sequelize;
const Event = db.Event;
const Category = db.Category;
const User = db.User;

// 1. 새 이벤트 생성 (POST /api/events)
exports.create = async (req, res) => {
  const { title, description, startAt, endAt, longitude, latitude, location, categoryIds } = req.body;
  const userId = req.user.userId;

  // req.file 객체에서 파일 정보를 확인
  const imageUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

  if (!title || !startAt || !endAt || !longitude || !latitude) {
    return res.status(400).send({ message: '필수 필드(title, startAt, endAt, longitude, latitude)를 모두 입력해야 합니다.' });
  }

  try {
    const event = await Event.create({
      userId,
      title,
      description,
      imageUrl,
      startAt,
      endAt,
      longitude,
      latitude,
      location
    });

    if (categoryIds && categoryIds.length > 0) {
      const categories = await Category.findAll({
        where: {
          categoryId: {
            [Op.in]: categoryIds,
          },
        },
      });
      await event.setCategories(categories);
    }

    res.status(201).send(event);
  } catch (error) {
    console.error('이벤트 생성 중 에러 발생:', error);
    res.status(500).send({ message: '서버 내부 오류가 발생했습니다.' });
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
  const { title, description, startAt, endAt, longitude, latitude, location, categoryIds } = req.body;
  const imageUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : undefined;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).send({ message: '이벤트를 찾을 수 없습니다.' });
    }

    if (event.userId !== userId) {
      return res.status(403).send({ message: '이벤트를 수정할 권한이 없습니다.' });
    }

    const updateData = {
      title,
      description,
      startAt,
      endAt,
      longitude,
      latitude,
      location,
    };

    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }


    await event.update(updateData);

    if (categoryIds) {
      const categories = await Category.findAll({
        where: { categoryId: { [Op.in]: JSON.parse(categoryIds) } },
      });
      await event.setCategories(categories);
    }

    res.status(200).send(event);
  } catch (error) {
    console.error('이벤트 수정 중 에러 발생:', error);
    res.status(500).send({ message: '서버 내부 오류가 발생했습니다.' });
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
    console.error(`Error deleting event: ${error.message}`);
    res.status(500).send({ message: "이벤트를 삭제하는 동안 서버 오류가 발생했습니다." });
  }
};

/**
 * [HELPER] 네이버 토큰을 갱신하고 원래 요청을 재시도하는 함수
 * @param {object} user - 사용자 모델 인스턴스
 * @param {function} originalRequest - 재시도할 원래 요청 함수
 */
const refreshNaverTokenAndRetry = async (user, originalRequest) => {
  try {
    console.log('네이버 액세스 토큰 갱신 시도...');
    const refreshToken = cryptoUtil.decrypt(user.naverRefreshToken);
    if (!refreshToken) {
      throw new Error('리프레시 토큰이 존재하지 않습니다.');
    }

    const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET } = process.env;
    const tokenUrl = `https://nid.naver.com/oauth2.0/token?grant_type=refresh_token&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&refresh_token=${refreshToken}`;

    const response = await axios.get(tokenUrl);
    const { access_token } = response.data;

    if (!access_token) {
      throw new Error('새로운 액세스 토큰을 발급받지 못했습니다.');
    }

    // DB에 새로운 액세스 토큰 저장 (암호화)
    user.naverAccessToken = cryptoUtil.encrypt(access_token);
    await user.save();
    console.log('새로운 네이버 액세스 토큰을 저장했습니다.');

    // 원래 요청 재시도
    return await originalRequest(access_token);
  } catch (error) {
    console.error('네이버 토큰 갱신 중 오류 발생:', error.response ? error.response.data : error.message);
    throw new Error('네이버 토큰 갱신에 실패했습니다. 다시 로그인해야 할 수 있습니다.');
  }
};


/**
 * 특정 이벤트를 사용자의 네이버 캘린더에 추가합니다.
 * POST /api/events/:eventId/add-to-naver-calendar
 */
exports.addEventToNaverCalendar = async (req, res) => {
  const { userId } = req.user;
  const { eventId } = req.params;

  try {
    const user = await db.User.findByPk(userId);
    const event = await Event.findByPk(eventId);

    if (!user) return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
    if (!event) return res.status(404).send({ message: "이벤트를 찾을 수 없습니다." });
    if (!user.naverAccessToken) return res.status(400).send({ message: "네이버 연동 정보가 없습니다. 다시 로그인하여 연동해주세요." });

    const decryptedAccessToken = cryptoUtil.decrypt(user.naverAccessToken);

    // 네이버 캘린더 API에 요청을 보내는 함수
    const apiRequest = async (accessToken) => {
      const scheduleIcalString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:Naver Calendar',
        'CALSCALE:GREGORIAN',
        'BEGIN:VTIMEZONE',
        'TZID:Asia/Seoul',
        'BEGIN:STANDARD',
        'DTSTART:19700101T000000',
        'TZNAME:GMT+09:00',
        'TZOFFSETFROM:+0900',
        'TZOFFSETTO:+0900',
        'END:STANDARD',
        'END:VTIMEZONE',
        'BEGIN:VEVENT',
        `UID:${uuidv4()}`,
        `DTSTART;TZID=Asia/Seoul:${event.startAt.toISOString().replace(/[-:.]/g, '').slice(0, 15)}`,
        `DTEND;TZID=Asia/Seoul:${event.endAt.toISOString().replace(/[-:.]/g, '').slice(0, 15)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.location || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\\n');

      const apiUrl = 'https://openapi.naver.com/calendar/createSchedule.json';
      const headers = { 'Authorization': `Bearer ${accessToken}` };
      const data = { 'calendarId': 'defaultCalendarId', 'scheduleIcalString': scheduleIcalString };

      return await axios.post(apiUrl, new URLSearchParams(data), { headers });
    };

    try {
      // 1. 첫 번째 시도
      const response = await apiRequest(decryptedAccessToken);
      return res.status(201).send({ message: '네이버 캘린더에 일정이 성공적으로 추가되었습니다.', result: response.data });
    } catch (error) {
      // 401 Unauthorized 에러는 토큰 만료를 의미할 수 있음
      if (error.response && error.response.status === 401) {
        console.log('액세스 토큰 만료. 토큰 갱신 후 재시도합니다.');
        // 2. 토큰 갱신 및 재시도
        const response = await refreshNaverTokenAndRetry(user, apiRequest);
        return res.status(201).send({ message: '토큰 갱신 후, 네이버 캘린더에 일정이 성공적으로 추가되었습니다.', result: response.data });
      }
      // 그 외 다른 에러
      throw error;
    }
  } catch (error) {
    console.error('네이버 캘린더 연동 중 에러:', error.response ? error.response.data : error.message);
    const message = error.message.includes('토큰 갱신에 실패')
      ? error.message
      : '캘린더에 일정을 추가하는 동안 서버 오류가 발생했습니다.';
    res.status(500).send({ message });
  }
}; 