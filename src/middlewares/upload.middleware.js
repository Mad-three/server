const multer = require('multer');

// 파일을 서버의 하드디스크가 아닌 메모리에 버퍼 형태로 저장합니다.
// 이렇게 하면 GCS로 파일을 스트리밍하기 용이해집니다.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 파일 사이즈 제한
  },
  // fileFilter는 이전과 동일하게 유지할 수 있습니다.
});

module.exports = upload; 