module.exports = (sequelize, DataTypes) => {
  const Event = sequelize.define('Event', {
    eventId: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
      comment: '이벤트 고유 ID',
    },
    // userId는 나중에 사용자 모델과 연결할 외래 키입니다.
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false, // 이제 사용자를 연결하므로 NULL을 허용하지 않음 (추후 로직 수정 필요)
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: '이벤트 제목',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true, // 설명은 비어있을 수 있음
      comment: '이벤트 상세 설명',
    },
    imageUrl: {
      type: DataTypes.STRING(2048),
      allowNull: true,
      comment: '이벤트 대표 이미지 URL',
    },
    startAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '이벤트 시작 일시',
    },
    endAt: {
      type: DataTypes.DATE,
      allowNull: false,
      comment: '이벤트 종료 일시',
    },
    longitude: {
      type: DataTypes.DECIMAL(10, 7), // 지도 경도
      allowNull: false,
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 7), // 지도 위도
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: '장소 이름 또는 주소 문자열',
    },
  }, {
    timestamps: true,
    tableName: 'events',
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
  });

  return Event;
}; 