const db = require('../models');
const { Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const cryptoUtil = require('../utils/crypto.util');

/**
 * JavaScript Date 객체를 'YYYYMMDDTHHMMSS' 형식의 KST 문자열로 변환하는 헬퍼 함수
 * @param {Date} date - 변환할 Date 객체
 * @returns {string} 'YYYYMMDDTHHMMSS' 형식의 문자열
 */
function toNaverCalendarFormat(date) {
  const pad = (num) => num.toString().padStart(2, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());

  return `${year}${month}${day}T${hours}${minutes}${seconds}`;
}


const sequelize = db.sequelize;
const Event = db.Event;
const Category = db.Category;
const User = db.User;


// 1. 새 이벤트 생성 (POST /api/events) - 트랜잭션은 유지
exports.create = async (req, res) => {
  console.log('Received request body:', req.body);
  const { title, description, startAt, endAt, longitude, latitude, location, categoryIds } = req.body;
  const userId = req.user.userId;
  const imageUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : null;

  if (!title || !startAt || !endAt || !longitude || !latitude) {
    return res.status(400).send({ message: '필수 필드(title, startAt, endAt, longitude, latitude)를 모두 입력해야 합니다.' });
  }

  const t = await sequelize.transaction();

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
    }, { transaction: t });

    // [롤백] categoryIds가 배열 형태로 온다고 가정 (기존 로직)
    if (categoryIds && categoryIds.length > 0) {
      // multipart/form-data로 전달된 categoryIds는 문자열이므로 JSON 파싱이 필요합니다.
      const parsedCategoryIds = JSON.parse(categoryIds);
      const categories = await Category.findAll({
        where: { categoryId: { [Op.in]: parsedCategoryIds } },
        transaction: t
      });
      await event.setCategories(categories, { transaction: t });
    }

    await t.commit();
    res.status(201).send(event);
  } catch (error) {
    await t.rollback();
    console.error('이벤트 생성 중 에러 발생:', error);
    res.status(500).send({ message: '서버 내부 오류가 발생했습니다.' });
  }
};

// 2. 모든 이벤트 조회 (GET /api/events) - 페이지네이션 롤백, SQL Injection 방지는 유지
exports.findAll = async (req, res) => {
  const loggedInUserId = req.user ? req.user.userId : null;

  try {
    const findOptions = {
      attributes: [
        'eventId', 'title', 'startAt', 'longitude', 'latitude', 'imageUrl', 'location',
        [sequelize.literal(`(SELECT COUNT(*) FROM "Likes" WHERE "Likes"."eventId" = "Event"."eventId")`), 'likeCount']
      ],
      include: [
        { model: Category, attributes: ['categoryId', 'name'], through: { attributes: [] } },
        { model: User, as: 'Author', attributes: ['userId', 'name'] }
      ],
      order: [['createdAt', 'DESC']],
    };

    // [보안 유지] SQL Injection 방지를 위해 replacements 사용
    if (loggedInUserId) {
      findOptions.attributes.push([
        sequelize.literal(`(EXISTS (SELECT 1 FROM "Likes" WHERE "Likes"."eventId" = "Event"."eventId" AND "Likes"."userId" = :userId))`),
        'isLiked'
      ]);
      findOptions.replacements = { userId: loggedInUserId };
    } else {
      findOptions.attributes.push([sequelize.literal('false'), 'isLiked']);
    }

    const events = await Event.findAll(findOptions);
    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({ message: error.message || "이벤트를 조회하는 동안 에러가 발생했습니다." });
  }
};

// 3. 특정 이벤트 상세 조회 (GET /api/events/:eventId) - SQL Injection 방지는 유지
exports.findOne = async (req, res) => {
  const { eventId } = req.params;
  const loggedInUserId = req.user ? req.user.userId : null;

  try {
    const findOptions = {
      include: [
        { model: Category, attributes: ['categoryId', 'name'], through: { attributes: [] } },
        { model: User, as: 'Author', attributes: ['userId', 'name', 'email'] },
        {
          model: db.Review,
          include: { model: User, attributes: ['userId', 'name'] },
          order: [['createdAt', 'DESC']]
        }
      ],
      attributes: {
        include: [
          [sequelize.literal(`(SELECT COUNT(*) FROM "Likes" WHERE "Likes"."eventId" = "Event"."eventId")`), 'likeCount']
        ]
      }
    };

    // [보안 유지] SQL Injection 방지를 위해 replacements 사용
    if (loggedInUserId) {
      findOptions.attributes.include.push([
        sequelize.literal(`(EXISTS (SELECT 1 FROM "Likes" WHERE "Likes"."eventId" = "Event"."eventId" AND "Likes"."userId" = :userId))`),
        'isLiked'
      ]);
      findOptions.replacements = { userId: loggedInUserId };
    } else {
      findOptions.attributes.include.push([sequelize.literal('false'), 'isLiked']);
    }

    const event = await Event.findByPk(eventId, findOptions);

    if (event) {
      res.status(200).send(event);
    } else {
      res.status(404).send({ message: "해당 이벤트를 찾을 수 없습니다." });
    }
  } catch (error) {
    res.status(500).send({ message: "이벤트를 조회하는 동안 에러가 발생했습니다." });
  }
};

// 4. 이벤트 '좋아요' 추가 (POST /api/events/:eventId/like) - 변경 없음
exports.likeEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).send({ message: "이벤트를 찾을 수 없습니다." });
    }
    await event.addLikingUsers(userId);
    res.status(200).send({ message: "좋아요를 눌렀습니다." });
  } catch (error) {
    res.status(500).send({ message: "좋아요 처리 중 에러가 발생했습니다." });
  }
};

// 5. 이벤트 '좋아요' 취소 (DELETE /api/events/:eventId/like) - 변경 없음
exports.unlikeEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await Event.findByPk(eventId);
    if (!event) {
      return res.status(404).send({ message: "이벤트를 찾을 수 없습니다." });
    }
    await event.removeLikingUsers(userId);
    res.status(200).send({ message: "좋아요를 취소했습니다." });
  } catch (error) {
    res.status(500).send({ message: "좋아요 취소 처리 중 에러가 발생했습니다." });
  }
};

// 6. 이벤트 수정 (PUT /api/events/:eventId) - 트랜잭션은 유지, 이미지 삭제 롤백, 파싱 롤백
exports.updateEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;
  const { title, description, startAt, endAt, longitude, latitude, location, categoryIds } = req.body;
  const imageUrl = req.file ? `/${req.file.path.replace(/\\/g, '/')}` : undefined;

  const t = await sequelize.transaction();

  try {
    const event = await Event.findByPk(eventId, { transaction: t });

    if (!event) {
      await t.rollback();
      return res.status(404).send({ message: '이벤트를 찾을 수 없습니다.' });
    }

    if (event.userId !== userId) {
      await t.rollback();
      return res.status(403).send({ message: '이벤트를 수정할 권한이 없습니다.' });
    }

    const updateData = { title, description, startAt, endAt, longitude, latitude, location };
    
    // [롤백] 이미지 수정 로직 (새 파일 업로드 시에만 변경)
    if (imageUrl !== undefined) {
      updateData.imageUrl = imageUrl;
    }

    await event.update(updateData, { transaction: t });

    // [롤백] categoryIds가 넘어온 경우, 안전하지 않은 기존 파싱 방식 사용
    if (categoryIds) {
      const categories = await Category.findAll({ 
        where: { categoryId: { [Op.in]: JSON.parse(categoryIds) } },
        transaction: t
      });
      await event.setCategories(categories, { transaction: t });
    }

    await t.commit();
    res.status(200).send(event);
  } catch (error) {
    await t.rollback();
    console.error('이벤트 수정 중 에러 발생:', error);
    res.status(500).send({ message: '서버 내부 오류가 발생했습니다.' });
  }
};

// 7. 이벤트 삭제 (DELETE /api/events/:eventId) - 변경 없음
exports.deleteEvent = async (req, res) => {
  const { eventId } = req.params;
  const { userId } = req.user;

  try {
    const event = await Event.findByPk(eventId);

    if (!event) {
      return res.status(404).send({ message: "삭제할 이벤트를 찾을 수 없습니다." });
    }

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


// 네이버 캘린더 연동 함수 - 변경 없음
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

    user.naverAccessToken = cryptoUtil.encrypt(access_token);
    await user.save();
    console.log('새로운 네이버 액세스 토큰을 저장했습니다.');

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

    if (!user || !event) {
        return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
    }
    if (!user.naverAccessToken) return res.status(400).send({ message: "네이버 연동 정보가 없습니다. 다시 로그인하여 연동해주세요." });

    // ★★★ 바로 이 부분에서 명시적으로 Date 객체로 변환합니다. ★★★
    const startDate = new Date(event.startAt);
    const endDate = new Date(event.endAt);

    // 유효한 Date 객체인지 확인하는 방어 코드 추가
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(500).send({ message: '이벤트의 날짜 형식이 올바르지 않습니다.' });
    }

    const decryptedAccessToken = cryptoUtil.decrypt(user.naverAccessToken);

    const apiRequest = async (accessToken) => {
      const scheduleIcalString = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:EventMap', // PRODID를 서비스 이름으로 변경하는 것을 추천
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
        `UID:${uuidv4()}@eventmap.com`, // UID를 더 고유하게 변경하는 것을 추천
        // toNaverCalendarFormat 함수를 사용하여 날짜 형식을 올바르게 변환합니다.
        `DTSTART;TZID=Asia/Seoul:${toNaverCalendarFormat(startDate)}`,
        `DTEND;TZID=Asia/Seoul:${toNaverCalendarFormat(endDate)}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.description || ''}`,
        `LOCATION:${event.location || ''}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\\r\\n'); // 줄바꿈 문자도 \r\n으로 수정하는 것을 추천

      const apiUrl = 'https://openapi.naver.com/calendar/createSchedule.json';
      const headers = {
        'Authorization': `Bearer ${accessToken}`,
        // 공식 문서에서 요구하는 Content-Type을 명시적으로 설정합니다.
        'Content-Type': 'application/x-www-form-urlencoded'
      };

      const data = {
        calendarId: 'defaultCalendarId',
        scheduleIcalString: scheduleIcalString
      };

      return await axios.post(apiUrl, data, { headers });
    };

    try {
      const response = await apiRequest(decryptedAccessToken);
      return res.status(201).send({ message: '네이버 캘린더에 일정이 성공적으로 추가되었습니다.', result: response.data });
    } catch (error) {
      if (error.response && error.response.status === 401) {
        console.log('액세스 토큰 만료. 토큰 갱신 후 재시도합니다.');
        const response = await refreshNaverTokenAndRetry(user, apiRequest);
        return res.status(201).send({ message: '토큰 갱신 후, 네이버 캘린더에 일정이 성공적으로 추가되었습니다.', result: response.data });
      }
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