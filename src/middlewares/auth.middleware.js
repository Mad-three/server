const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  try {
    // 1. 요청 헤더에서 토큰 추출
    // 'Authorization' 헤더는 'Bearer <토큰값>' 형태를 가집니다.
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(403).send({ message: "인증 토큰이 필요합니다." });
    }

    const token = authHeader.split(' ')[1]; // 'Bearer ' 부분을 제외하고 토큰 값만 추출
    const { JWT_SECRET } = process.env;

    // 2. 토큰 검증
    // 유효하지 않거나 만료된 경우, 여기서 에러가 발생합니다.
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. 검증 성공 시, 요청 객체에 사용자 정보 저장
    // 디코딩된 페이로드(여기서는 { userId: ... })를 req.user에 할당
    req.user = decoded;

    // 4. 다음 미들웨어 또는 컨트롤러로 요청 전달
    next();

  } catch (error) {
    // 토큰 만료, 변조 등 모든 에러를 처리
    if (error.name === 'TokenExpiredError') {
      return res.status(419).send({ message: "토큰이 만료되었습니다." });
    }
    return res.status(403).send({ message: "유효하지 않은 토큰입니다." });
  }
};

module.exports = verifyToken; 