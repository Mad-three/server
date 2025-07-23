const express = require('express');
const db = require('./models');
const cors = require('cors'); // cors 라이브러리 불러오기
const eventRoutes = require('./routes/event.routes');
const categoryRoutes = require('./routes/category.routes');
const reviewRoutes = require('./routes/review.routes');
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const searchRoutes = require('./routes/search.routes');
const topLevelReviewRoutes = require('./routes/topLevelReview.routes');
const mapRoutes = require('./routes/map.routes'); // map.routes.js 임포트

const app = express();
const port = process.env.PORT || 3001;
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'https://event-map-client.vercel.app' // Vercel 클라이언트 주소 추가
];
if (process.env.FRONTEND_URL) {
  allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
  origin: allowedOrigins,
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  credentials: true,
};

app.options('*', cors(corsOptions));
app.use(cors(corsOptions));
app.use(express.json());

app.use('/uploads', express.static('uploads'));

app.use('/api/events', eventRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events/:eventId/reviews', reviewRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/reviews', topLevelReviewRoutes);
app.use('/api/maps', mapRoutes);

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