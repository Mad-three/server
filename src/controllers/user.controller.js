const db = require('../models');
const User = db.User;

// 1. 현재 로그인한 내 정보 조회 (GET /api/users/me)
exports.getMyInfo = async (req, res) => {
  const { userId } = req.user; // 인증 미들웨어에서 추가해준 사용자 ID

  try {
    const user = await User.findByPk(userId, {
      // 비밀번호 같은 민감한 정보는 제외하고 반환
      attributes: { exclude: ['naverId', 'updatedAt'] }
    });

    if (!user) {
      return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).send(user);
  } catch (error) {
    res.status(500).send({
      message: "내 정보 조회 중 에러가 발생했습니다."
    });
  }
};

// 2. 내가 작성한 이벤트 목록 조회 (GET /api/users/me/events)
exports.getMyAuthoredEvents = async (req, res) => {
  const { userId } = req.user;

  try {
    // 'AuthoredEvents' 라는 별칭으로 관계를 조회
    const events = await db.Event.findAll({
      where: { userId: userId },
      // 필요한 정보만 간추려서 반환 (예: 제목, 시작일, 좋아요 수)
      attributes: ['eventId', 'title', 'startAt', 'location'],
      order: [['createdAt', 'DESC']], // 최신순으로 정렬
    });

    res.status(200).send(events);
  } catch (error) {
    res.status(500).send({
      message: "내가 작성한 이벤트를 조회하는 중 에러가 발생했습니다."
    });
  }
};

// 3. 내가 '좋아요' 누른 이벤트 목록 조회 (GET /api/users/me/liked-events)
exports.getMyLikedEvents = async (req, res) => {
  const { userId } = req.user;

  try {
    const user = await User.findByPk(userId, {
      // 'LikedEvents' 라는 별칭으로 관계를 조회
      include: [{
        model: db.Event,
        as: 'LikedEvents',
        attributes: ['eventId', 'title', 'startAt', 'location'],
        through: { attributes: [] } // 연결 테이블(Likes)의 정보는 결과에 포함시키지 않음
      }],
      attributes: [] // User의 기본 정보는 필요 없으므로 제외
    });

    if (!user) {
      return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
    }

    res.status(200).send(user.LikedEvents || []);
  } catch (error) {
    res.status(500).send({
      message: "좋아요 누른 이벤트를 조회하는 중 에러가 발생했습니다."
    });
  }
};

// 4. 내가 작성한 후기 목록 조회 (GET /api/users/me/reviews)
exports.getMyReviews = async (req, res) => {
  const { userId } = req.user;

  try {
    const reviews = await db.Review.findAll({
      where: { userId: userId },
      include: [{
        model: db.Event,
        attributes: ['eventId', 'title'] // 후기와 관련된 이벤트의 기본 정보만 포함
      }],
      order: [['createdAt', 'DESC']], // 최신순으로 정렬
    });

    res.status(200).send(reviews);
  } catch (error) {
    res.status(500).send({ message: "내가 작성한 후기를 조회하는 중 에러가 발생했습니다." });
  }
};

// 5. 내 정보 수정 (PUT /api/users/me)
exports.updateMyInfo = async (req, res) => {
  const { userId } = req.user;
  const { name } = req.body;

  // 유효성 검사: 이름은 비어있을 수 없음
  if (!name || name.trim() === '') {
    return res.status(400).send({ message: "이름을 입력해주세요." });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      // 이 경우는 거의 발생하지 않음 (verifyToken을 통과했기 때문)
      return res.status(404).send({ message: "사용자를 찾을 수 없습니다." });
    }

    user.name = name;
    await user.save();

    res.status(200).send({ message: "사용자 정보가 성공적으로 수정되었습니다.", user: { userId: user.userId, name: user.name, email: user.email } });
  } catch (error) {
    res.status(500).send({ message: "사용자 정보 수정 중 에러가 발생했습니다." });
  }
}; 