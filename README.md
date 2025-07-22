# EventMap 서버 API 명세서

이 문서는 EventMap 애플리케이션의 백엔드 서버 API를 설명합니다.

## 기본 정보

-   **Base URL**: `/api`

## 인증 (Authentication)

### **POST** `/api/auth/naver/login`

네이버 소셜 로그인을 처리합니다. 인가 코드를 받아 서버에서 Access Token을 발급받고, 사용자 정보를 조회/생성합니다.

-   **Request Body:**
    -   `code` (string, required): 네이버 로그인 인증 성공 후 받은 인가 코드.
    -   `state` (string, required): CSRF 공격을 방지하기 위한 상태 값.
-   **Response (Success):**
    -   `accessToken` (string): 서버에서 발행한 JWT 액세스 토큰.

---

## 사용자 (Users)

### **GET** `/api/users/me`

현재 로그인된 사용자의 정보를 조회합니다.

-   **Headers:**
    -   `Authorization`: `Bearer {accessToken}`
-   **Response (Success):**
    -   `userId` (integer): 사용자 ID.
    -   `email` (string): 사용자 이메일.
    -   `name` (string): 사용자 이름.

---

## 이벤트 (Events)

### **POST** `/api/events`

새로운 이벤트를 생성합니다.

-   **Headers:**
    -   `Authorization`: `Bearer {accessToken}`
-   **Request Body (form-data):**
    -   `title` (string, required): 이벤트 제목.
    -   `description` (string): 이벤트 설명.
    -   `startAt` (datetime, required): 시작 일시 (예: `2024-08-15T18:00:00`).
    -   `endAt` (datetime, required): 종료 일시.
    -   `longitude` (number, required): 경도.
    -   `latitude` (number, required): 위도.
    -   `location` (string): 장소명.
    -   `image` (file): 이벤트 대표 이미지 파일.
    -   `categoryIds` (array of integers): 이벤트가 속한 카테고리 ID 배열.
-   **Response (Success):**
    -   `message` (string): "이벤트가 성공적으로 등록되었습니다."

### **GET** `/api/events`

모든 이벤트를 조회합니다. (페이징, 필터링 기능 추가 가능)

-   **Response (Success):**
    -   Array of Event objects.

### **GET** `/api/events/:eventId`

특정 이벤트의 상세 정보를 조회합니다.

-   **Response (Success):**
    -   Event object.

---

## 카테고리 (Categories)

### **GET** `/api/categories`

모든 이벤트 카테고리를 조회합니다.

-   **Response (Success):**
    -   Array of Category objects (`categoryId`, `name`).

---

## 검색 (Search)

### **GET** `/api/search`

키워드로 이벤트를 검색합니다.

-   **Query Parameters:**
    -   `keyword` (string, required): 검색할 키워드.
-   **Response (Success):**
    -   Array of matching Event objects.

---

## 지도 (Maps)

### **GET** `/api/maps/geocode`

주소를 위도와 경도 좌표로 변환합니다. (Geocoding)

-   **Query Parameters:**
    -   `address` (string, required): 변환할 주소 문자열. (예: `서울시청`)
-   **Response (Success):**
    -   `longitude` (string): 경도 좌표.
    -   `latitude` (string): 위도 좌표.
    -   `roadAddress` (string): 변환된 도로명 주소.
-   **Response (Error 400):**
    -   `message`: "주소를 입력해주세요."
-   **Response (Error 404):**
    -   `message`: "해당 주소에 대한 좌표를 찾을 수 없습니다."