'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
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

    for (const category of categories) {
      const existingCategory = await queryInterface.findOne('categories', {
        where: {
          name: category.name,
        },
      });

      if (!existingCategory) {
        await queryInterface.bulkInsert('categories', [category], {});
      }
    }
  },

  async down (queryInterface, Sequelize) {
    // 모든 카테고리를 삭제합니다.
    await queryInterface.bulkDelete('categories', {}, {});
  }
};
