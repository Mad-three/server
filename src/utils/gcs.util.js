const { Storage } = require('@google-cloud/storage');
const path = require('path');

// Render 환경 변수에서 JSON 키 파일 내용을 읽어와 파싱합니다.
// 로컬 테스트 시에는 이 부분에서 오류가 발생할 수 있으므로, 
// 로컬용 .env 파일과 GCS_KEYFILE_JSON 변수 설정이 필요합니다.
let credentials;
try {
    credentials = JSON.parse(process.env.GCS_KEYFILE_JSON);
} catch (error) {
    console.error("GCS KEYFILE JSON 파싱 실패! GCS_KEYFILE_JSON 환경변수를 확인하세요.", error);
    // 로컬 환경에서는 서비스 계정 키 파일 경로를 직접 지정할 수도 있습니다.
    // credentials = { keyFilename: path.join(__dirname, '../../gcs-key.json') };
}

const storage = new Storage({
    projectId: process.env.GCS_PROJECT_ID,
    credentials,
});

const bucket = storage.bucket(process.env.GCS_BUCKET_NAME);

/**
 * 메모리에 저장된 파일을 Google Cloud Storage에 업로드하고 공개 URL을 반환합니다.
 * @param {object} file - multer가 req.file에 추가해준 파일 객체
 * @returns {Promise<string|null>} 업로드 성공 시 파일의 공개 URL, 파일이 없으면 null
 */
function uploadToGCS(file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            return resolve(null);
        }

        const blob = bucket.file(`${Date.now()}_${path.basename(file.originalname)}`);
        const blobStream = blob.createWriteStream({
            resumable: false,
            contentType: file.mimetype,
        });

        blobStream.on('error', (err) => {
            console.error("GCS 업로드 스트림 에러:", err);
            reject(err);
        });

        blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;
            resolve(publicUrl);
        });

        blobStream.end(file.buffer);
    });
}

module.exports = { uploadToGCS }; 