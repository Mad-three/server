const Sequelize = require('sequelize');
const config = require('../config/config').development;

const db = {};

const sequelize = new Sequelize(
  config.database,
  config.username,
  config.password,
  config
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 모델 등록
db.Category = require('./category.model.js')(sequelize, Sequelize);
db.Event = require('./event.model.js')(sequelize, Sequelize);
db.Review = require('./review.model.js')(sequelize, Sequelize);
db.User = require('./user.model.js')(sequelize, Sequelize);

// --- 관계 설정 (Association) ---

// 이벤트 - 카테고리 (다대다)
db.Event.belongsToMany(db.Category, {
  through: 'EventCategory', // 연결 테이블의 이름
  foreignKey: 'eventId',
  otherKey: 'categoryId',
  timestamps: false,
});
db.Category.belongsToMany(db.Event, {
  through: 'EventCategory', // 연결 테이블의 이름
  foreignKey: 'categoryId',
  otherKey: 'eventId',
  timestamps: false,
});

// 이벤트 - 후기 (일대다)
db.Event.hasMany(db.Review, { foreignKey: 'eventId', onDelete: 'CASCADE' });
db.Review.belongsTo(db.Event, { foreignKey: 'eventId' });

// 사용자 - 이벤트 (일대다 - 작성자 관계)
db.User.hasMany(db.Event, { foreignKey: 'userId', as: 'AuthoredEvents' });
db.Event.belongsTo(db.User, { foreignKey: 'userId', as: 'Author' });

// 사용자 - 후기 (일대다)
db.User.hasMany(db.Review, { foreignKey: 'userId' });
db.Review.belongsTo(db.User, { foreignKey: 'userId' });

// 사용자 - 이벤트 (다대다 - '좋아요' 관계)
db.User.belongsToMany(db.Event, {
  through: 'Likes', // 연결 테이블 이름
  as: 'LikedEvents', // 관계의 별칭
  foreignKey: 'userId',
  timestamps: false,
});
db.Event.belongsToMany(db.User, {
  through: 'Likes', // 연결 테이블 이름
  as: 'LikingUsers', // 관계의 별칭
  foreignKey: 'eventId',
  onDelete: 'CASCADE', // 이벤트 삭제 시 좋아요 기록도 삭제
  timestamps: false,
});


module.exports = db;