const multer = require('multer');
const path = require('path');

// 파일 저장 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // 파일이 저장될 경로
  },
  filename: (req, file, cb) => {
    // 파일명 중복을 피하기 위해 현재 시간과 원본 파일명을 조합
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

// 파일 필터 설정 (이미지 파일만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const mimetype = allowedTypes.test(file.mimetype);
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb(new Error('이미지 파일(jpeg, jpg, png, gif)만 업로드할 수 있습니다.'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB 제한
  },
  fileFilter: fileFilter,
});

module.exports = upload; 