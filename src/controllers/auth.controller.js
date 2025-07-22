const db = require('../models');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const cryptoUtil = require('../utils/crypto.util');

const User = db.User;
const { NAVER_CLIENT_ID, NAVER_CLIENT_SECRET, JWT_SECRET } = process.env;

exports.naverLogin = async (req, res) => {
  const { code, state } = req.body;

  if (!code || !state) {
    return res.status(400).send({ message: "code와 state는 필수입니다." });
  }

  const callbackUrl = `https://nid.naver.com/oauth2.0/token?grant_type=authorization_code&client_id=${NAVER_CLIENT_ID}&client_secret=${NAVER_CLIENT_SECRET}&code=${code}&state=${state}`;

  try {
    // 1. 네이버에 토큰 요청
    const tokenResponse = await axios.get(callbackUrl);
    const { access_token, refresh_token } = tokenResponse.data;

    if (!access_token) {
      return res.status(400).send({ message: "네이버로부터 액세스 토큰을 받아오지 못했습니다." });
    }

    // 2. 받은 토큰으로 사용자 프로필 조회
    const profileResponse = await axios.get('https://openapi.naver.com/v1/nid/me', {
      headers: { 'Authorization': `Bearer ${access_token}` },
    });
    const naverProfile = profileResponse.data.response;

    // 3. 사용자 정보 조회 및 JWT 발급
    const [user, created] = await User.findOrCreate({
      where: { email: naverProfile.email },
      defaults: {
        name: naverProfile.name,
        naverId: naverProfile.id,
        naverAccessToken: cryptoUtil.encrypt(access_token),
        naverRefreshToken: cryptoUtil.encrypt(refresh_token),
      },
    });

    // 기존 사용자인 경우, 네이버 토큰 정보 업데이트
    if (!created) {
      await user.update({
        naverAccessToken: cryptoUtil.encrypt(access_token),
        // refresh_token은 처음 발급받을 때만 제공되므로, 새로 받은 값이 있을 때만 업데이트
        naverRefreshToken: refresh_token ? cryptoUtil.encrypt(refresh_token) : user.naverRefreshToken,
      });
    }

    // 우리 서비스의 JWT 토큰 발급
    const ourToken = jwt.sign({ userId: user.userId }, JWT_SECRET, { expiresIn: '1h' });

    res.status(200).send({
      message: "로그인 성공",
      token: ourToken,
      user: {
        userId: user.userId,
        email: user.email,
        name: user.name,
      }
    });

  } catch (error) {
    console.error('네이버 로그인 처리 중 에러 발생:', error.response ? error.response.data : error.message);
    res.status(500).send({ message: "서버 내부 오류가 발생했습니다." });
  }
}; 