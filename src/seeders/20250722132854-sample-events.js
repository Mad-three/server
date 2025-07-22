'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 먼저 기존 유저와 카테고리를 조회합니다.
    // 실제로는 seeder 실행 순서에 의존하지 않도록,
    // 이 자리에서 필요한 user나 category를 조회하거나 생성하는 로직을 넣는 것이 더 안정적입니다.
    // 여기서는 편의상 ID가 존재한다고 가정합니다.
    await queryInterface.bulkInsert('events', [
      {
        userId: 1, // 테스트유저1
        title: '한강 나이트워크 2024',
        description: '밤의 한강을 따라 걷는 이색적인 마라톤 행사입니다. 친구, 연인과 함께 특별한 추억을 만드세요.',
        imageUrl: '/images/sample-event-1.jpg',
        startAt: new Date('2024-08-15T18:00:00'),
        endAt: new Date('2024-08-15T23:00:00'),
        longitude: 126.934,
        latitude: 37.555,
        location: '여의도 한강공원',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 2, // 테스트유저2
        title: '코엑스 푸드위크 2024',
        description: '국내 최대 규모의 식품 박람회. 다양한 먹거리와 최신 푸드 트렌드를 만나보세요.',
        imageUrl: '/images/sample-event-2.jpg',
        startAt: new Date('2024-11-20T10:00:00'),
        endAt: new Date('2024-11-23T18:00:00'),
        longitude: 127.058,
        latitude: 37.511,
        location: '코엑스(COEX)',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        userId: 3, // 홍길동
        title: '렛츠락 페스티벌',
        description: '국내 최고의 밴드들이 참여하는 도심 속 락 페스티벌!',
        imageUrl: '/images/sample-event-3.jpg',
        startAt: new Date('2024-09-21T12:00:00'),
        endAt: new Date('2024-09-22T23:00:00'),
        longitude: 126.918,
        latitude: 37.575,
        location: '난지 한강공원',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ], {});

    // 이벤트와 카테고리를 연결하는 데이터 (EventCategory 중간 테이블)
    await queryInterface.bulkInsert('EventCategory', [
      { eventId: 1, categoryId: 5, createdAt: new Date(), updatedAt: new Date() }, // 한강 나이트워크 -> 경기
      { eventId: 1, categoryId: 4, createdAt: new Date(), updatedAt: new Date() }, // 한강 나이트워크 -> 축제
      { eventId: 2, categoryId: 6, createdAt: new Date(), updatedAt: new Date() }, // 푸드위크 -> 박람회
      { eventId: 3, categoryId: 3, createdAt: new Date(), updatedAt: new Date() }, // 렛츠락 -> 공연
      { eventId: 3, categoryId: 4, createdAt: new Date(), updatedAt: new Date() }, // 렛츠락 -> 축제
    ], {});
  },

  async down(queryInterface, Sequelize) {
    // 연결 테이블 데이터 먼저 삭제
    await queryInterface.bulkDelete('EventCategory', null, {});
    await queryInterface.bulkDelete('events', null, {});
  },
};
