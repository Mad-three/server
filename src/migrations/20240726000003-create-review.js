'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('reviews', {
      reviewId: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
        comment: '후기 고유 ID',
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'userId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '후기를 작성한 사용자 ID',
      },
      eventId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'events',
          key: 'eventId',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: '후기가 달린 이벤트 ID',
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: '후기 내용',
      },
      rating: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '별점 (1~5)',
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
    await queryInterface.dropTable('reviews');
  },
}; 