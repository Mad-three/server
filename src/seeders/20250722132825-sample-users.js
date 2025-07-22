'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const users = await queryInterface.rawSelect('users', {
      where: {},
    }, ['userId']);

    if (users) {
      return;
    }

    await queryInterface.bulkInsert('users', [
      {
        userId: 1,
        email: 'user1@example.com',
        name: '테스트유저1',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 2,
        email: 'user2@example.com',
        name: '테스트유저2',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 3,
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
