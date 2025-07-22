'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.bulkInsert('users', [
      {
        email: 'user1@example.com',
        name: '테스트유저1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user2@example.com',
        name: '테스트유저2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        email: 'user3@example.com',
        name: '홍길동',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', null, {});
  }
};
