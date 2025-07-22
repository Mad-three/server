const axios = require('axios');

const getCoordsFromAddress = async (req, res) => {
  const { address } = req.query;

  if (!address) {
    return res.status(400).json({ message: '주소를 입력해주세요.' });
  }

  try {
    const response = await axios.get('https://naveropenapi.apigw.gov-ntruss.com/map-geocode/v2/geocode', {
      params: {
        query: address,
      },
      headers: {
        'Accept': 'application/json',
        'x-ncp-apigw-api-key-id': process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_ID,
        'x-ncp-apigw-api-key': process.env.NEXT_PUBLIC_NAVER_MAPS_CLIENT_SECRET,
      },
    });

    if (response.data.status !== 'OK' || response.data.addresses.length === 0) {
      return res.status(404).json({ message: '해당 주소에 대한 좌표를 찾을 수 없습니다.' });
    }

    const firstResult = response.data.addresses[0];
    res.status(200).json({
      longitude: firstResult.x, // 경도
      latitude: firstResult.y,  // 위도
      roadAddress: firstResult.roadAddress, // 도로명 주소
    });

  } catch (error) {
    console.error('Geocoding API Error:', error.response ? error.response.data : error.message);
    res.status(500).json({ message: '주소를 좌표로 변환하는 중 서버 오류가 발생했습니다.' });
  }
};

module.exports = {
  getCoordsFromAddress,
};