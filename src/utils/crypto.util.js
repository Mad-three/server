const crypto = require('crypto-js');

/**
 * 환경 변수에서 JWT_SECRET을 가져옵니다.
 * 이 비밀 키는 암호화 및 복호화에 사용됩니다.
 */
const secret = process.env.JWT_SECRET;

/**
 * 주어진 텍스트를 AES 알고리즘으로 암호화합니다.
 * @param {string} text - 암호화할 텍스트 (예: 네이버 액세스 토큰)
 * @returns {string | null} 암호화된 문자열 또는 입력이 없을 경우 null
 */
exports.encrypt = (text) => {
  if (!text) return null;
  return crypto.AES.encrypt(text, secret).toString();
};

/**
 * 주어진 암호문을 복호화합니다.
 * @param {string} ciphertext - 복호화할 암호문
 * @returns {string | null} 복호화된 원본 텍스트 또는 입력이 없을 경우 null
 */
exports.decrypt = (ciphertext) => {
  if (!ciphertext) return null;
  const bytes = crypto.AES.decrypt(ciphertext, secret);
  return bytes.toString(crypto.enc.Utf8);
}; 