const express = require('express');
const db = require('./models');
const cors = require('cors'); // cors 라이브러리 불러오기

const app = express();
// [수정] Render에서 제공하는 PORT 환경 변수를 사용하고, 없을 경우 3001을 기본값으로 사용
const port = process.env.PORT || 3001;

// '/uploads' 경로로 들어오는 요청에 대해 'uploads' 디렉토리의 파일을 제공합니다.
app.use('/uploads', express.static('uploads'));

// [수정] CORS 설정을 동적으로 관리
const allowedOrigins = ['http://localhost:3000', 'http://127.0.0.1:3000'];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

// Pre-flight 요청과 실제 요청 모두에 동일한 CORS 정책 적용
app.options('*', cors(corsOptions)); // Pre-flight 요청 처리
app.use(cors(corsOptions)); // 실제 요청 처리

// [수정] 파일 업로드 라우트를 JSON 파서보다 먼저 등록하여 "Boundary not found" 에러 해결
const eventRoutes = require('./routes/event.routes');
app.use('/api/events', eventRoutes);

// JSON 형식의 요청 본문을 파싱하기 위한 미들웨어 설정
app.use(express.json());

// 나머지 라우터 등록
const categoryRoutes = require('./routes/category.routes');
app.use('/api/categories', categoryRoutes); // '/api/categories' 경로로 오는 요청은 categoryRoutes가 처리

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

const mapRoutes = require('./routes/map.routes'); // map.routes.js 임포트
app.use('/api/maps', mapRoutes); // mapRoutes 등록

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