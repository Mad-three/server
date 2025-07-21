module.exports = (sequelize, DataTypes) => {
  const Review = sequelize.define('Review', {
    reviewId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '후기 고유 ID',
    },
    // eventId와 userId는 index.js에서 관계 설정 시 자동으로 생성됩니다.
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      comment: '후기 내용',
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
      comment: '별점 (1~5)',
    },
  }, {
    timestamps: true,
    tableName: 'reviews',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  return Review;
}; 