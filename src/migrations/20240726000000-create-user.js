'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('users', {
      userId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: '사용자 고유 ID',
      },
      email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        comment: '사용자 이메일 (로그인 시 사용)',
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false,
        comment: '사용자 이름 또는 닉네임',
      },
      naverId: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true,
        comment: '네이버에서 제공하는 고유 식별자',
      },
      naverAccessToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '네이버 API 접근을 위한 암호화된 Access Token',
      },
      naverRefreshToken: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Access Token 갱신을 위한 암호화된 Refresh Token',
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('users');
  },
}; 