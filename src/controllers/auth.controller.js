const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../models');
const User = db.User;
const crypto = require('crypto-js'); // crypto-js 라이브러리 추가

// 토큰 암호화 함수
const encryptToken = (token, secret) => {
  return crypto.AES.encrypt(token, secret).toString();
};

exports.naverLogin = async (req, res) => {
  const { code, state } = req.body;
  // 암호화 키로 JWT_SECRET을 같이 사용
  const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, JWT_SECRET } = process.env;

  if (!code || !state) {
    return res.status(400).send({ message: "인증 코드와 상태 값이 필요합니다." });
  }

  const tokenUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${encodeURIComponent(state)}`;
  const profileUrl = 'https://openapi.naver.com/v1/nid/me';

  try {
    // 1. 네이버에 액세스 토큰 요청
    const tokenResponse = await axios.get(tokenUrl);
    // refresh_token 추가로 받기
    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(400).send({ message: "네이버로부터 액세스 토큰을 발급받지 못했습니다." });
    }

    // 2. 네이버에 사용자 프로필 정보 요청
    const profileResponse = await axios.get(profileUrl, {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const { response: naverProfile } = profileResponse.data;

    // 3. 우리 DB에서 사용자 조회 또는 생성
    const [user, created] = await User.findOrCreate({
      where: { email: naverProfile.email },
      defaults: {
        name: naverProfile.name,
        naverId: naverProfile.id,
        // 암호화하여 저장
        naverAccessToken: encryptToken(access_token, JWT_SECRET),
        naverRefreshToken: refresh_token ? encryptToken(refresh_token, JWT_SECRET) : null,
      },
    });

    // 4. 만약 기존 사용자라면 (created === false), 토큰 정보 업데이트
    if (!created) {
      await user.update({
        naverAccessToken: encryptToken(access_token, JWT_SECRET),
        naverRefreshToken: refresh_token ? encryptToken(refresh_token, JWT_SECRET) : user.naverRefreshToken, // refresh 토큰은 없을 경우 기존 값 유지
      });
    }

    // 5. 우리 서비스의 JWT 생성
    const ourToken = jwt.sign(
      { userId: user.userId }, // JWT에 담을 정보 (페이로드)
      JWT_SECRET,             // 서명에 사용할 비밀 키
      { expiresIn: '1h' }      // 토큰 유효 기간 (예: 1시간)
    );

    // 6. 생성된 JWT를 클라이언트에 전달
    res.status(200).send({
      message: created ? "회원가입 및 로그인 성공!" : "로그인 성공!",
      token: ourToken,
      user: {
        userId: user.userId,
        name: user.name,
        email: user.email,
      }
    });

  } catch (error) {
    console.error("네이버 로그인 처리 중 에러:", error.response ? error.response.data : error.message);
    res.status(500).send({
      message: "네이버 로그인 처리 중 서버 에러가 발생했습니다."
    });
  }
}; 