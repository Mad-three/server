'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('events', {
      eventId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: '이벤트 고유 ID',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users', // 'users' 테이블 참조
          key: 'userId', // 'users' 테이블의 'userId' 컬럼 참조
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '이벤트를 생성한 사용자 ID',
      },
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: '이벤트 제목',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: '이벤트 상세 설명',
      },
      imageUrl: {
        type: Sequelize.STRING(2048),
        allowNull: true,
        comment: '이벤트 대표 이미지 URL',
      },
      startAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '이벤트 시작 일시',
      },
      endAt: {
        type: Sequelize.DATE,
        allowNull: false,
        comment: '이벤트 종료 일시',
      },
      longitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
        comment: '지도 경도',
      },
      latitude: {
        type: Sequelize.DECIMAL(10, 7),
        allowNull: false,
        comment: '지도 위도',
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: '장소 이름 또는 주소 문자열',
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
    await queryInterface.dropTable('events');
  },
}; 