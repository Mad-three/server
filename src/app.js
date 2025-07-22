const express = require('express');
const db = require('./models');
const cors = require('cors'); // cors 라이브러리 불러오기

const app = express();
const port = 3001;

// '/uploads' 경로로 들어오는 요청에 대해 'uploads' 디렉토리의 파일을 제공합니다.
app.use('/uploads', express.static('uploads'));

// CORS 설정
const corsOptions = {
  origin: 'http://localhost:3000', // 허용할 출처
  credentials: true, // 쿠키 등 자격 증명 허용
};
app.use(cors(corsOptions));

// JSON 형식의 요청 본문을 파싱하기 위한 미들웨어 설정
app.use(express.json());

// 라우터 등록
const categoryRoutes = require('./routes/category.routes');
app.use('/api/categories', categoryRoutes); // '/api/categories' 경로로 오는 요청은 categoryRoutes가 처리

const eventRoutes = require('./routes/event.routes');
app.use('/api/events', eventRoutes);

const reviewRoutes = require('./routes/review.routes');
// '/api/events/:eventId/reviews' 경로로 오는 요청은 reviewRoutes가 처리
app.use('/api/events/:eventId/reviews', reviewRoutes);

const authRoutes = require('./routes/auth.routes');
app.use('/api/auth', authRoutes);

const userRoutes = require('./routes/user.routes');
app.use('/api/users', userRoutes);

const searchRoutes = require('./routes/search.routes');
app.use('/api/search', searchRoutes);

// 후기 수정/삭제를 위한 최상위 라우터
const topLevelReviewRoutes = require('./routes/topLevelReview.routes');
app.use('/api/reviews', topLevelReviewRoutes);

app.get('/', (req, res) => {
  res.send('Hello, EventMap Server!');
});

db.sequelize.sync({ force: false })
  .then(() => {
    console.log('✅ 데이터베이스 연결 성공');
    app.listen(port, () => {
      console.log(`🚀 서버가 http://localhost:${port} 에서 실행 중입니다.`);
    });
  })
  .catch((err) => {
    console.error('❌ 데이터베이스 연결 실패:', err);
  });