'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    const categoriesResult = await queryInterface.rawSelect('categories', {
      where: {},
    }, ['name']);

    if (categoriesResult) {
      console.log('Categories already seeded.');
      return;
    }

    const categories = [
      { name: '마켓', createdAt: new Date(), updatedAt: new Date() },
      { name: '전시', createdAt: new Date(), updatedAt: new Date() },
      { name: '공연', createdAt: new Date(), updatedAt: new Date() },
      { name: '축제', createdAt: new Date(), updatedAt: new Date() },
      { name: '경기', createdAt: new Date(), updatedAt: new Date() },
      { name: '박람회', createdAt: new Date(), updatedAt: new Date() },
      { name: '컨퍼런스', createdAt: new Date(), updatedAt: new Date() },
      { name: '기타', createdAt: new Date(), updatedAt: new Date() }
    ];

    await queryInterface.bulkInsert('categories', categories, {});
  },

  async down (queryInterface, Sequelize) {
    // categories 테이블과 연관된 모든 테이블의 데이터를 지우고 ID 카운터를 리셋합니다.
    await queryInterface.sequelize.query('TRUNCATE "categories" RESTART IDENTITY CASCADE;');
  }
};
