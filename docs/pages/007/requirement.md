# 요구사항 명세서: 예약 조회 페이지 - 예약 검색

## 문서 정보
- **기능 ID**: REQ-007
- **기능 명**: 예약 조회 및 검색
- **관련 유저플로우**: #7
- **작성일**: 2025-10-15
- **버전**: 1.0

---

## 1. 기능 개요

### 1.1. 목적
사용자가 예약 번호 또는 예약 시 입력한 연락처 정보를 통해 자신의 예약 내역을 검색하고 조회할 수 있는 기능을 제공합니다.

### 1.2. 범위
- 예약 검색 폼 제공
- 예약 번호 또는 연락처 기반 검색
- 검색 결과 목록 표시
- 예약 상세 페이지로의 네비게이션

### 1.3. 사용자 시나리오
```
사용자가 콘서트 예약을 완료한 후 시간이 지나서 예약 내역을 확인하고 싶어합니다.
예약 완료 시 받은 예약 번호 또는 예약 시 입력했던 휴대폰 번호를 입력하여
자신의 예약 정보를 조회하고, 필요시 상세 정보를 확인하거나 취소할 수 있습니다.
```

---

## 2. 화면 구성 및 UI 요소

### 2.1. 페이지 레이아웃
```
┌─────────────────────────────────────────┐
│ 헤더 (Navigation Bar)                    │
├─────────────────────────────────────────┤
│                                         │
│  예약 조회                               │
│  ─────────────────────────────────      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 예약 번호 입력                   │   │
│  │ [____________________]          │   │
│  │                                 │   │
│  │ 연락처 입력                      │   │
│  │ [____________________]          │   │
│  │                                 │   │
│  │        [조회하기]                │   │
│  └─────────────────────────────────┘   │
│                                         │
│  검색 결과                               │
│  ─────────────────────────────────      │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 콘서트 제목: 아이유 콘서트 2024  │   │
│  │ 관람 일시: 2025년 12월 25일 19시 │   │
│  │ 좌석: A01, A02 (2석)            │   │
│  │ 예약 상태: 확정                  │   │
│  │ 총 금액: 300,000원              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │ 콘서트 제목: BTS 월드 투어       │   │
│  │ 관람 일시: 2025년 12월 31일 18시 │   │
│  │ 좌석: S01 (1석)                 │   │
│  │ 예약 상태: 취소됨               │   │
│  │ 총 금액: 150,000원              │   │
│  └─────────────────────────────────┘   │
│                                         │
│  [1] [2] [3] ... (페이지네이션)         │
│                                         │
└─────────────────────────────────────────┘
```

### 2.2. UI 컴포넌트 명세

#### 2.2.1. 검색 폼 섹션
- **예약 번호 입력 필드**
  - 타입: Text Input
  - Placeholder: "예약 번호를 입력하세요 (예: a1b2c3d4-...)"
  - 유효성 검증: UUID 형식
  - 선택사항 (연락처와 OR 조건)

- **연락처 입력 필드**
  - 타입: Text Input
  - Placeholder: "휴대폰 번호 또는 이메일을 입력하세요"
  - 유효성 검증: 
    - 휴대폰: 010-XXXX-XXXX 형식
    - 이메일: 표준 이메일 형식
  - 선택사항 (예약 번호와 OR 조건)

- **조회하기 버튼**
  - 타입: Submit Button
  - 상태:
    - 기본: 활성화 (파란색 배경)
    - 로딩 중: 비활성화 + 스피너 표시
    - 오류: 활성화 복원
  - 동작: 검색 API 호출

#### 2.2.2. 검색 결과 섹션
- **예약 카드**
  - 레이아웃: 카드 형태
  - 정보 표시:
    - 콘서트 제목 (굵은 글씨)
    - 관람 일시 (YYYY년 MM월 DD일 HH시)
    - 좌석 정보 (좌석 번호 및 개수)
    - 예약 상태 (뱃지 형태: 확정/취소됨)
    - 총 금액 (통화 형식)
  - 상호작용: 클릭 시 상세 페이지 이동
  - 시각적 구분:
    - 확정 예약: 흰색 배경, 파란색 테두리
    - 취소 예약: 회색 배경, 회색 테두리

- **빈 상태 UI**
  - 표시 조건: 검색 결과가 없을 때
  - 내용:
    - 아이콘 (검색 결과 없음)
    - "검색 결과가 없습니다" 메시지
    - "예약 번호 또는 연락처를 다시 확인해주세요" 안내

- **페이지네이션**
  - 표시 조건: 검색 결과가 10개 초과
  - 페이지당 항목 수: 10개
  - UI: 숫자 버튼 + 이전/다음 버튼

---

## 3. 사용자 행동 및 데이터 흐름

### 3.1. 페이지 진입

#### 사용자 행동
1. 사용자가 예약 조회 페이지 URL(`/reservations`)에 접속
2. 또는 예약 완료 페이지에서 "예약 조회하기" 버튼 클릭

#### 시스템 동작
1. 프론트엔드가 예약 조회 페이지 컴포넌트를 렌더링
2. 검색 폼 초기 상태를 설정
3. 검색 결과 섹션을 빈 상태로 표시

#### 데이터 변화
- **클라이언트 상태**:
  ```typescript
  {
    searchForm: {
      reservationId: "",
      contact: ""
    },
    searchResults: [],
    isLoading: false,
    error: null
  }
  ```

---

### 3.2. 검색 조건 입력

#### 사용자 행동
1. 예약 번호 입력 필드에 값 입력 (또는)
2. 연락처 입력 필드에 휴대폰 번호 또는 이메일 입력

#### 시스템 동작
1. 입력값을 실시간으로 검증
2. 입력 형식이 올바른지 체크
3. 오류 시 필드 하단에 오류 메시지 표시

#### 유효성 검증 규칙

**예약 번호**
```typescript
// UUID 형식 검증
const isValidUUID = (value: string) => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

// 오류 메시지
"올바른 예약 번호 형식이 아닙니다"
```

**휴대폰 번호**
```typescript
// 한국 휴대폰 번호 형식 검증
const isValidPhone = (value: string) => {
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  return phoneRegex.test(value);
};

// 오류 메시지
"올바른 휴대폰 번호 형식을 입력해주세요 (예: 010-1234-5678)"
```

**이메일**
```typescript
// 이메일 형식 검증
const isValidEmail = (value: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

// 오류 메시지
"올바른 이메일 형식을 입력해주세요"
```

#### 데이터 변화
- **클라이언트 상태 업데이트**:
  ```typescript
  {
    searchForm: {
      reservationId: "a1b2c3d4-...", // 사용자 입력값
      contact: "010-1234-5678"       // 사용자 입력값
    },
    validationErrors: {
      reservationId: null,  // 또는 오류 메시지
      contact: null         // 또는 오류 메시지
    }
  }
  ```

---

### 3.3. 예약 검색 요청

#### 사용자 행동
1. "조회하기" 버튼 클릭

#### 시스템 동작

**프론트엔드**
1. 최종 유효성 검증 수행
2. 예약 번호 OR 연락처 중 최소 하나가 입력되었는지 확인
3. 로딩 상태 활성화 (버튼 비활성화, 스피너 표시)
4. 백엔드 API 호출

**API 요청**
```http
GET /api/reservations/search?reservationId={id}&phone={phone}&email={email}

Query Parameters:
- reservationId (optional): UUID 형식의 예약 번호
- phone (optional): 휴대폰 번호 (010-XXXX-XXXX)
- email (optional): 이메일 주소

예시:
GET /api/reservations/search?phone=010-1234-5678
GET /api/reservations/search?reservationId=a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**백엔드**
1. 쿼리 파라미터 추출 및 검증
2. 검색 조건 구성 (OR 조건)
3. 데이터베이스 쿼리 실행

**데이터베이스 쿼리**
```sql
-- 예약 검색 쿼리
SELECT 
  r.id,
  r.status,
  r.customer_name,
  r.customer_phone,
  r.total_price,
  r.created_at,
  r.cancelled_at,
  c.title as concert_title,
  s.date_time as schedule_datetime,
  -- 좌석 정보를 JSON 배열로 집계
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'seat_number', st.seat_number,
      'grade', st.grade,
      'price', st.price
    )
  ) as seats
FROM reservations r
INNER JOIN schedules s ON r.schedule_id = s.id
INNER JOIN concerts c ON s.concert_id = c.id
LEFT JOIN seats st ON st.id = ANY(r.seat_ids)
WHERE 
  (r.id::text = $1 OR $1 IS NULL)
  OR (r.customer_phone = $2 OR $2 IS NULL)
  OR (r.customer_email = $3 OR $3 IS NULL)
GROUP BY r.id, c.id, s.id
ORDER BY r.created_at DESC
LIMIT 100;

-- 파라미터:
-- $1: reservationId (NULL이면 조건 무시)
-- $2: phone (NULL이면 조건 무시)
-- $3: email (NULL이면 조건 무시)
```

**테이블 관계**
```
reservations (예약 정보)
  ├─ schedule_id → schedules (공연 일정)
  │                  └─ concert_id → concerts (콘서트 정보)
  └─ seat_ids[] → seats (좌석 정보, 배열)
```

#### 데이터 변화

**데이터베이스 접근**
- **테이블**: `reservations`, `concerts`, `schedules`, `seats`
- **작업**: READ (조회만, 데이터 변경 없음)
- **인덱스 활용**:
  - `reservations.id` (Primary Key)
  - `reservations.customer_phone` (인덱스)
  - `reservations.customer_email` (인덱스)

**API 응답**
```typescript
// 성공 응답 (200 OK)
{
  ok: true,
  data: [
    {
      id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      concertTitle: "아이유 콘서트 2024",
      scheduleDateTime: "2025-12-25T19:00:00+09:00",
      customerName: "홍길동",
      totalPrice: 300000,
      status: "confirmed",
      seats: [
        { seatNumber: "A01", grade: "R", price: 150000 },
        { seatNumber: "A02", grade: "R", price: 150000 }
      ],
      createdAt: "2025-10-15T10:30:00+09:00",
      cancelledAt: null
    },
    // ... 추가 예약
  ]
}

// 검색 결과 없음 (200 OK)
{
  ok: true,
  data: []
}

// 오류 응답 (400 Bad Request)
{
  ok: false,
  error: {
    code: "INVALID_SEARCH_PARAMS",
    message: "예약 번호 또는 연락처를 입력해주세요"
  }
}

// 서버 오류 (500 Internal Server Error)
{
  ok: false,
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "서버 오류가 발생했습니다"
  }
}
```

**클라이언트 상태 업데이트**
```typescript
// 성공 시
{
  searchResults: [...], // API 응답 데이터
  isLoading: false,
  error: null
}

// 결과 없음 시
{
  searchResults: [],
  isLoading: false,
  error: null
}

// 오류 시
{
  searchResults: [],
  isLoading: false,
  error: "검색 중 오류가 발생했습니다"
}
```

---

### 3.4. 검색 결과 표시

#### 시스템 동작
1. API 응답 데이터를 파싱
2. 예약 카드 목록 렌더링
3. 각 카드에 예약 정보 표시

#### 데이터 표시 로직

**예약 상태 뱃지**
```typescript
const getStatusBadge = (status: string, cancelledAt: string | null) => {
  if (status === 'confirmed') {
    return {
      text: '확정',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800'
    };
  } else if (status === 'cancelled') {
    return {
      text: '취소됨',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-600'
    };
  }
};
```

**날짜 포맷팅**
```typescript
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

const formatScheduleDateTime = (dateTime: string) => {
  return format(new Date(dateTime), 'yyyy년 MM월 dd일 HH시', { locale: ko });
  // 출력 예: "2025년 12월 25일 19시"
};
```

**좌석 정보 요약**
```typescript
const formatSeats = (seats: Seat[]) => {
  const seatNumbers = seats.map(s => s.seatNumber).join(', ');
  const seatCount = seats.length;
  return `${seatNumbers} (${seatCount}석)`;
  // 출력 예: "A01, A02 (2석)"
};
```

**금액 포맷팅**
```typescript
const formatPrice = (price: number) => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
  // 출력 예: "300,000원"
};
```

#### 빈 상태 처리
```typescript
if (searchResults.length === 0 && !isLoading) {
  return (
    <EmptyState>
      <Icon name="search-x" />
      <p>검색 결과가 없습니다</p>
      <p>예약 번호 또는 연락처를 다시 확인해주세요</p>
    </EmptyState>
  );
}
```

---

### 3.5. 예약 상세 페이지 이동

#### 사용자 행동
1. 검색 결과 목록에서 특정 예약 카드 클릭

#### 시스템 동작
1. 클릭된 예약의 ID 추출
2. 예약 상세 페이지로 네비게이션
3. URL: `/reservations/{reservationId}`

#### 데이터 전달
```typescript
// Next.js Router 사용
const handleCardClick = (reservationId: string) => {
  router.push(`/reservations/${reservationId}`);
};
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (페이지 이동만)
- **클라이언트**: 라우팅 상태 변경

---

### 3.6. 페이지네이션

#### 조건
- 검색 결과가 10개를 초과하는 경우

#### 시스템 동작
1. 결과를 10개씩 페이지로 분할
2. 페이지네이션 UI 표시
3. 페이지 번호 클릭 시 해당 페이지로 이동

#### 구현 방식

**클라이언트 사이드 페이지네이션**
```typescript
const ITEMS_PER_PAGE = 10;

const paginatedResults = useMemo(() => {
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  return searchResults.slice(startIndex, endIndex);
}, [searchResults, currentPage]);

const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
```

**또는 서버 사이드 페이지네이션** (대량 데이터 시)
```http
GET /api/reservations/search?phone=010-1234-5678&page=1&pageSize=10
```

```sql
SELECT ...
FROM reservations r
...
ORDER BY r.created_at DESC
LIMIT 10 OFFSET 0;  -- page=1이면 OFFSET 0, page=2이면 OFFSET 10
```

---

## 4. 오류 처리 및 엣지 케이스

### 4.1. 입력 검증 오류

#### 케이스
- 검색 조건이 하나도 입력되지 않음

#### 처리
```typescript
const handleSubmit = (e: FormEvent) => {
  e.preventDefault();
  
  if (!searchForm.reservationId && !searchForm.contact) {
    setError("예약 번호 또는 연락처를 입력해주세요");
    return;
  }
  
  // 검색 API 호출
};
```

#### 데이터 변화
- 데이터베이스 접근 없음
- 클라이언트 상태만 업데이트 (오류 메시지 표시)

---

### 4.2. 잘못된 형식 입력

#### 케이스
- 예약 번호가 UUID 형식이 아님
- 휴대폰 번호 형식이 틀림
- 이메일 형식이 틀림

#### 처리
```typescript
// 실시간 검증
const validateReservationId = (value: string) => {
  if (value && !isValidUUID(value)) {
    return "올바른 예약 번호 형식이 아닙니다";
  }
  return null;
};

const validateContact = (value: string) => {
  if (value && !isValidPhone(value) && !isValidEmail(value)) {
    return "올바른 휴대폰 번호 또는 이메일 형식을 입력해주세요";
  }
  return null;
};
```

#### 데이터 변화
- 데이터베이스 접근 없음 (클라이언트 검증)
- API 요청 차단

---

### 4.3. 검색 결과 없음

#### 케이스
- 입력한 조건과 일치하는 예약이 없음

#### 처리
- API는 200 OK + 빈 배열 반환
- 프론트엔드에서 빈 상태 UI 표시

#### 데이터 흐름
```
User Input → API Request → DB Query → No Results → Empty Array
→ Frontend → Empty State UI
```

#### 데이터베이스
- 쿼리는 정상 실행되나 결과 행 0개

---

### 4.4. 네트워크 오류

#### 케이스
- API 요청 중 네트워크 연결 실패

#### 처리
```typescript
try {
  const response = await fetch('/api/reservations/search?...');
  // ...
} catch (error) {
  setError("검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요");
  setShowRetryButton(true);
}
```

#### 데이터 변화
- 데이터베이스: 접근 시도했으나 실패
- 클라이언트: 오류 상태 + 재시도 버튼 활성화

---

### 4.5. 서버 오류

#### 케이스
- 데이터베이스 연결 실패
- 쿼리 실행 오류

#### 처리
```typescript
// 백엔드
try {
  const result = await db.query(sql, params);
  return { ok: true, data: result.rows };
} catch (error) {
  logger.error('Database query failed', error);
  return { 
    ok: false, 
    error: { 
      code: 'INTERNAL_SERVER_ERROR',
      message: '서버 오류가 발생했습니다'
    }
  };
}
```

#### 데이터 변화
- 데이터베이스: 오류 로그 기록
- 클라이언트: 오류 메시지 + 재시도 옵션

---

### 4.6. 다수의 검색 결과

#### 케이스
- 검색 결과가 10개 이상

#### 처리
- 페이지네이션 UI 표시
- 페이지당 10개씩 표시

#### 데이터 흐름
```
Total Results: 25
Page 1: Results 1-10
Page 2: Results 11-20
Page 3: Results 21-25
```

---

### 4.7. 취소된 예약 포함

#### 케이스
- 검색 결과에 status='cancelled'인 예약 포함

#### 처리
- 정상적으로 목록에 표시
- 시각적으로 구분 (회색 배경, "취소됨" 뱃지)
- 취소 일시 표시

#### 데이터 쿼리
```sql
-- 취소된 예약도 포함하여 조회 (WHERE 조건에 status 필터 없음)
SELECT ...
WHERE (r.id::text = $1 OR ...)
-- status에 대한 필터링 없음
ORDER BY r.created_at DESC;
```

---

### 4.8. 동시 검색 요청

#### 케이스
- 사용자가 검색 중에 다시 조회 버튼 클릭

#### 처리
```typescript
const [isLoading, setIsLoading] = useState(false);

const handleSearch = async () => {
  if (isLoading) return; // 이미 검색 중이면 무시
  
  setIsLoading(true);
  try {
    // API 호출
  } finally {
    setIsLoading(false);
  }
};
```

#### 데이터 변화
- 첫 번째 요청만 처리
- 중복 요청은 클라이언트에서 차단
- 데이터베이스 불필요한 쿼리 방지

---

## 5. 성능 요구사항

### 5.1. 응답 시간
- **검색 결과 응답**: 2초 이내
- **페이지 초기 로드**: 1초 이내

### 5.2. 데이터베이스 최적화

#### 인덱스 활용
```sql
-- 필요한 인덱스
CREATE INDEX idx_reservations_customer_phone ON reservations(customer_phone);
CREATE INDEX idx_reservations_customer_email ON reservations(customer_email);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);
```

#### 쿼리 최적화
- JOIN은 필요한 테이블만 포함
- SELECT는 필요한 컬럼만 조회
- LIMIT로 결과 수 제한 (최대 100건)

### 5.3. 동시 접속 처리
- 최소 100건/초의 검색 요청 처리 가능
- 데이터베이스 커넥션 풀 관리

---

## 6. 보안 요구사항

### 6.1. 개인정보 보호
- 예약 번호(UUID)는 추측 불가능한 형식
- 연락처 정보는 예약자 본인 확인 용도로만 사용
- 다른 사용자의 예약 정보 조회 불가

### 6.2. SQL Injection 방어
```typescript
// 파라미터화된 쿼리 사용 (절대 문자열 연결 금지)
const result = await db.query(
  'SELECT ... WHERE r.id = $1 OR r.customer_phone = $2',
  [reservationId, phone]
);
```

### 6.3. Rate Limiting
- 동일 IP에서 분당 최대 10회 검색 제한
- 무차별 대입 공격 방지

---

## 7. 데이터 모델

### 7.1. 관련 테이블

#### reservations (예약)
```sql
- id: UUID (Primary Key)
- schedule_id: UUID (Foreign Key → schedules)
- seat_ids: UUID[] (좌석 ID 배열)
- total_price: INTEGER
- customer_name: VARCHAR(100)
- customer_phone: VARCHAR(20)
- customer_email: VARCHAR(255), nullable
- status: VARCHAR(20) ('confirmed' | 'cancelled')
- created_at: TIMESTAMPTZ
- cancelled_at: TIMESTAMPTZ, nullable
```

#### schedules (공연 일정)
```sql
- id: UUID (Primary Key)
- concert_id: UUID (Foreign Key → concerts)
- date_time: TIMESTAMPTZ
```

#### concerts (콘서트)
```sql
- id: UUID (Primary Key)
- title: VARCHAR(255)
- poster_image_url: TEXT
```

#### seats (좌석)
```sql
- id: UUID (Primary Key)
- schedule_id: UUID (Foreign Key → schedules)
- seat_number: VARCHAR(10)
- grade: VARCHAR(5)
- price: INTEGER
- status: VARCHAR(20)
```

### 7.2. 데이터 관계도
```
reservations
  ├─ schedule_id ──→ schedules
  │                    ├─ concert_id ──→ concerts
  │                    └─ date_time
  └─ seat_ids[] ──→ seats[]
                      ├─ seat_number
                      ├─ grade
                      └─ price
```

---

## 8. 구현 체크리스트

### 8.1. 프론트엔드
- [ ] 예약 조회 페이지 컴포넌트 생성
- [ ] 검색 폼 구현 (예약 번호, 연락처 입력)
- [ ] 실시간 입력 검증 로직
- [ ] 검색 API 호출 훅 (React Query)
- [ ] 검색 결과 카드 컴포넌트
- [ ] 빈 상태 UI
- [ ] 로딩 상태 UI (스피너)
- [ ] 오류 상태 UI (재시도 버튼)
- [ ] 페이지네이션 컴포넌트
- [ ] 예약 상세 페이지 네비게이션

### 8.2. 백엔드
- [ ] 예약 검색 API 엔드포인트 (`GET /api/reservations/search`)
- [ ] 쿼리 파라미터 검증 (Zod 스키마)
- [ ] 데이터베이스 쿼리 함수
- [ ] 예약 정보 조회 서비스 로직
- [ ] 오류 처리 및 로깅
- [ ] API 응답 포맷 표준화

### 8.3. 데이터베이스
- [ ] 인덱스 생성 (customer_phone, customer_email)
- [ ] 쿼리 성능 테스트
- [ ] 샘플 데이터로 검색 테스트

### 8.4. 테스트
- [ ] 정상 검색 테스트 (예약 번호로 검색)
- [ ] 정상 검색 테스트 (연락처로 검색)
- [ ] 검색 결과 없음 테스트
- [ ] 잘못된 형식 입력 테스트
- [ ] 네트워크 오류 시나리오 테스트
- [ ] 페이지네이션 동작 테스트
- [ ] 취소된 예약 표시 테스트

---

## 9. 향후 개선 사항

### 9.1. 기능 개선
- 검색 필터 추가 (날짜 범위, 예약 상태)
- 검색 히스토리 저장 (로컬 스토리지)
- 예약 내역 엑셀 다운로드

### 9.2. 성능 개선
- 서버 사이드 페이지네이션으로 전환
- 검색 결과 캐싱 (Redis)
- 데이터베이스 쿼리 최적화

### 9.3. UX 개선
- 검색 조건 자동 완성
- 검색 결과 정렬 옵션
- 모바일 최적화 UI

---

## 10. 참고 자료
- PRD: `/docs/prd.md`
- 유저플로우: `/docs/userflow.md` - 유저플로우 #7
- 데이터베이스 설계: `/docs/database.md`
- 유스케이스 명세: `/docs/pages/007/spec.md`

