module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    userId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '사용자 고유 ID',
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      comment: '사용자 이메일 (로그인 시 사용)',
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      comment: '사용자 이름 또는 닉네임',
    },
    naverId: {
      type: DataTypes.STRING,
      allowNull: true, // 네이버 로그인이 아닌 다른 방식도 고려하여 NULL 허용
      unique: true,
      comment: '네이버에서 제공하는 고유 식별자',
    },
    naverAccessToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: '네이버 API 접근을 위한 암호화된 Access Token',
    },
    naverRefreshToken: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Access Token 갱신을 위한 암호화된 Refresh Token',
    },
  }, {
    timestamps: true,
    tableName: 'users',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  return User;
}; 