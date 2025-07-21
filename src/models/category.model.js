module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define('Category', {
    // 모델의 속성(필드) 정의
    categoryId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '카테고리 고유 ID',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '카테고리 이름',
    },
  }, {
    // 모델의 옵션 정의
    timestamps: true, // createdAt, updatedAt 컬럼 자동 생성
    tableName: 'categories', // 실제 데이터베이스 테이블 이름
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  return Category;
}; 