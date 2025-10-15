# 상태 정의: 예약 조회 페이지 - 예약 검색

## 문서 정보
- **기능 ID**: STATE-007
- **기능 명**: 예약 조회 상태 관리
- **관련 문서**: 
  - 요구사항: `/docs/pages/007/requirement.md`
  - 유스케이스: `/docs/pages/007/spec.md`
- **작성일**: 2025-10-15
- **버전**: 1.0

---

## 1. 관리해야 할 상태 데이터 목록

### 1.1. 검색 폼 상태

#### `searchForm`
- **타입**: `{ reservationId: string; contact: string }`
- **초기값**: `{ reservationId: "", contact: "" }`
- **설명**: 사용자가 입력한 검색 조건
- **저장 위치**: 컴포넌트 로컬 상태 (React State)
- **변경 주체**: 사용자 입력

```typescript
type SearchFormState = {
  reservationId: string;  // 예약 번호 (UUID)
  contact: string;        // 휴대폰 번호 또는 이메일
};
```

---

#### `validationErrors`
- **타입**: `{ reservationId: string | null; contact: string | null }`
- **초기값**: `{ reservationId: null, contact: null }`
- **설명**: 입력 필드별 유효성 검증 오류 메시지
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 실시간 입력 검증 로직

```typescript
type ValidationErrorsState = {
  reservationId: string | null;  // 예: "올바른 예약 번호 형식이 아닙니다"
  contact: string | null;        // 예: "올바른 휴대폰 번호 형식을 입력해주세요"
};
```

---

### 1.2. 검색 결과 상태

#### `searchResults`
- **타입**: `Reservation[]`
- **초기값**: `[]`
- **설명**: 서버에서 받은 예약 검색 결과 목록
- **저장 위치**: React Query 캐시 또는 컴포넌트 상태
- **변경 주체**: API 응답

```typescript
type Reservation = {
  id: string;                      // 예약 ID (UUID)
  concertTitle: string;            // 콘서트 제목
  scheduleDateTime: string;        // 공연 일시 (ISO 8601)
  customerName: string;            // 예약자 이름
  totalPrice: number;              // 총 금액
  status: 'confirmed' | 'cancelled'; // 예약 상태
  seats: Array<{
    seatNumber: string;            // 좌석 번호
    grade: string;                 // 좌석 등급
    price: number;                 // 좌석 가격
  }>;
  createdAt: string;               // 예약 생성 일시
  cancelledAt: string | null;      // 취소 일시 (취소된 경우)
};

type SearchResultsState = Reservation[];
```

---

### 1.3. UI 상태

#### `isLoading`
- **타입**: `boolean`
- **초기값**: `false`
- **설명**: 검색 API 호출 중 여부
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: API 호출 시작/완료

```typescript
type IsLoadingState = boolean;
```

---

#### `error`
- **타입**: `string | null`
- **초기값**: `null`
- **설명**: API 호출 실패 시 오류 메시지
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: API 호출 실패 또는 성공 시 초기화

```typescript
type ErrorState = string | null;
// 예: "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
```

---

#### `currentPage`
- **타입**: `number`
- **초기값**: `1`
- **설명**: 페이지네이션 현재 페이지 번호
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 사용자의 페이지 번호 클릭

```typescript
type CurrentPageState = number; // 1-based index
```

---

### 1.4. 전체 상태 타입 정의

```typescript
type ReservationSearchPageState = {
  // 검색 폼
  searchForm: {
    reservationId: string;
    contact: string;
  };
  
  // 검증 오류
  validationErrors: {
    reservationId: string | null;
    contact: string | null;
  };
  
  // 검색 결과
  searchResults: Reservation[];
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  currentPage: number;
};
```

---

## 2. 화면상에 보여지지만 상태가 아닌 것

### 2.1. 파생(Derived) 데이터

이들은 기존 상태로부터 계산되는 값으로, 별도로 상태로 관리할 필요가 없습니다.

#### `paginatedResults`
- **설명**: 현재 페이지에 표시할 예약 목록
- **계산 방법**:
  ```typescript
  const ITEMS_PER_PAGE = 10;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedResults = searchResults.slice(startIndex, endIndex);
  ```
- **의존 상태**: `searchResults`, `currentPage`

---

#### `totalPages`
- **설명**: 전체 페이지 수
- **계산 방법**:
  ```typescript
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE);
  ```
- **의존 상태**: `searchResults`

---

#### `hasSearchResults`
- **설명**: 검색 결과 존재 여부
- **계산 방법**:
  ```typescript
  const hasSearchResults = searchResults.length > 0;
  ```
- **의존 상태**: `searchResults`

---

#### `showEmptyState`
- **설명**: 빈 상태 UI 표시 여부
- **계산 방법**:
  ```typescript
  const showEmptyState = !isLoading && searchResults.length === 0;
  ```
- **의존 상태**: `isLoading`, `searchResults`

---

#### `showPagination`
- **설명**: 페이지네이션 UI 표시 여부
- **계산 방법**:
  ```typescript
  const showPagination = searchResults.length > ITEMS_PER_PAGE;
  ```
- **의존 상태**: `searchResults`

---

#### `isSearchButtonDisabled`
- **설명**: 조회 버튼 비활성화 여부
- **계산 방법**:
  ```typescript
  const isSearchButtonDisabled = isLoading || 
    (!searchForm.reservationId && !searchForm.contact);
  ```
- **의존 상태**: `isLoading`, `searchForm`

---

#### `hasValidationErrors`
- **설명**: 유효성 검증 오류 존재 여부
- **계산 방법**:
  ```typescript
  const hasValidationErrors = 
    validationErrors.reservationId !== null || 
    validationErrors.contact !== null;
  ```
- **의존 상태**: `validationErrors`

---

### 2.2. 포맷팅된 표시 데이터

#### `formattedScheduleDateTime`
- **설명**: 형식화된 공연 일시 (예: "2025년 12월 25일 19시")
- **계산 방법**:
  ```typescript
  const formattedScheduleDateTime = format(
    new Date(reservation.scheduleDateTime), 
    'yyyy년 MM월 dd일 HH시', 
    { locale: ko }
  );
  ```
- **의존 데이터**: `reservation.scheduleDateTime`

---

#### `formattedSeats`
- **설명**: 형식화된 좌석 정보 (예: "A01, A02 (2석)")
- **계산 방법**:
  ```typescript
  const seatNumbers = reservation.seats.map(s => s.seatNumber).join(', ');
  const seatCount = reservation.seats.length;
  const formattedSeats = `${seatNumbers} (${seatCount}석)`;
  ```
- **의존 데이터**: `reservation.seats`

---

#### `formattedPrice`
- **설명**: 형식화된 금액 (예: "300,000원")
- **계산 방법**:
  ```typescript
  const formattedPrice = new Intl.NumberFormat('ko-KR').format(
    reservation.totalPrice
  ) + '원';
  ```
- **의존 데이터**: `reservation.totalPrice`

---

#### `statusBadge`
- **설명**: 예약 상태 뱃지 정보 (텍스트, 색상)
- **계산 방법**:
  ```typescript
  const statusBadge = reservation.status === 'confirmed'
    ? { text: '확정', bgColor: 'bg-blue-100', textColor: 'text-blue-800' }
    : { text: '취소됨', bgColor: 'bg-gray-100', textColor: 'text-gray-600' };
  ```
- **의존 데이터**: `reservation.status`

---

### 2.3. 상수 데이터

#### UI 상수
```typescript
const ITEMS_PER_PAGE = 10;              // 페이지당 항목 수
const MAX_SEARCH_RESULTS = 100;         // 최대 검색 결과 수
```

#### 텍스트 상수
```typescript
const PLACEHOLDERS = {
  reservationId: "예약 번호를 입력하세요 (예: a1b2c3d4-...)",
  contact: "휴대폰 번호 또는 이메일을 입력하세요"
};

const ERROR_MESSAGES = {
  invalidReservationId: "올바른 예약 번호 형식이 아닙니다",
  invalidPhone: "올바른 휴대폰 번호 형식을 입력해주세요 (예: 010-1234-5678)",
  invalidEmail: "올바른 이메일 형식을 입력해주세요",
  noSearchCriteria: "예약 번호 또는 연락처를 입력해주세요",
  searchFailed: "검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요"
};
```

---

## 3. 상태 변경 조건 및 화면 변화

### 3.1. searchForm 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 예약 번호 입력 필드에 텍스트 입력 | `{ reservationId: "", contact: "" }` | `{ reservationId: "a1b2c3d4", contact: "" }` | - 입력 필드에 입력한 텍스트 표시<br/>- 실시간 검증 실행<br/>- 조회 버튼 활성화 가능 |
| 연락처 입력 필드에 텍스트 입력 | `{ reservationId: "", contact: "" }` | `{ reservationId: "", contact: "010-1234" }` | - 입력 필드에 입력한 텍스트 표시<br/>- 실시간 검증 실행<br/>- 조회 버튼 활성화 가능 |
| 검색 후 새로운 검색을 위해 입력 클리어 | `{ reservationId: "a1b2c3d4-...", contact: "" }` | `{ reservationId: "", contact: "" }` | - 입력 필드 비어있음<br/>- 조회 버튼 비활성화 |

---

### 3.2. validationErrors 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 잘못된 예약 번호 형식 입력 | `{ reservationId: null, contact: null }` | `{ reservationId: "올바른 예약 번호 형식이 아닙니다", contact: null }` | - 예약 번호 입력 필드 하단에 빨간색 오류 메시지 표시<br/>- 입력 필드 테두리 빨간색으로 변경<br/>- 조회 버튼 비활성화 (선택적) |
| 올바른 형식으로 수정 | `{ reservationId: "올바른...", contact: null }` | `{ reservationId: null, contact: null }` | - 오류 메시지 제거<br/>- 입력 필드 테두리 정상 색상으로 복원<br/>- 조회 버튼 활성화 가능 |
| 잘못된 휴대폰 번호 형식 입력 | `{ reservationId: null, contact: null }` | `{ reservationId: null, contact: "올바른 휴대폰 번호 형식을..." }` | - 연락처 입력 필드 하단에 오류 메시지 표시<br/>- 입력 필드 테두리 빨간색<br/>- 조회 버튼 비활성화 (선택적) |
| 잘못된 이메일 형식 입력 | `{ reservationId: null, contact: null }` | `{ reservationId: null, contact: "올바른 이메일 형식을..." }` | - 연락처 입력 필드 하단에 오류 메시지 표시<br/>- 입력 필드 테두리 빨간색 |

---

### 3.3. searchResults 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 최초 로드 | `undefined` | `[]` | - 검색 결과 섹션에 아무것도 표시 안됨<br/>- 빈 상태 UI 표시 안됨 (아직 검색 안함) |
| 검색 API 호출 성공 (결과 있음) | `[]` | `[{id: "...", concertTitle: "아이유 콘서트", ...}, ...]` | - 예약 카드 목록이 화면에 렌더링<br/>- 각 카드에 콘서트명, 일시, 좌석 등 표시<br/>- 결과가 10개 초과 시 페이지네이션 표시<br/>- 로딩 인디케이터 제거 |
| 검색 API 호출 성공 (결과 없음) | `[]` | `[]` | - 빈 상태 UI 표시<br/>  - 검색 결과 없음 아이콘<br/>  - "검색 결과가 없습니다" 메시지<br/>  - "예약 번호 또는 연락처를 다시 확인해주세요" 안내<br/>- 로딩 인디케이터 제거 |
| 새로운 검색 수행 (이전 결과 대체) | `[{id: "1", ...}, {id: "2", ...}]` | `[{id: "3", ...}]` | - 기존 예약 카드가 사라지고 새로운 결과로 대체<br/>- 페이지네이션이 첫 페이지로 리셋<br/>- currentPage도 1로 리셋 |
| 취소된 예약 포함된 결과 | `[]` | `[{id: "1", status: "confirmed", ...}, {id: "2", status: "cancelled", cancelledAt: "...", ...}]` | - 확정 예약: 흰색 배경, 파란색 테두리, "확정" 뱃지<br/>- 취소 예약: 회색 배경, 회색 테두리, "취소됨" 뱃지<br/>- 취소된 예약에는 취소 일시도 추가 표시 |

---

### 3.4. isLoading 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 조회 버튼 클릭 (API 호출 시작) | `false` | `true` | - 조회 버튼이 비활성화됨<br/>- 버튼 내부에 스피너 아이콘 표시<br/>- 버튼 텍스트 "조회 중..." 또는 스피너만 표시<br/>- 입력 필드 비활성화 (선택적)<br/>- 검색 결과 영역에 로딩 스켈레톤 UI 표시 |
| API 응답 수신 (성공 또는 실패) | `true` | `false` | - 조회 버튼 활성화<br/>- 스피너 아이콘 제거<br/>- 버튼 텍스트 "조회하기"로 복원<br/>- 입력 필드 활성화<br/>- 로딩 스켈레톤 제거 |

---

### 3.5. error 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 상태 | `undefined` | `null` | - 오류 메시지 표시 안됨 |
| API 호출 실패 (네트워크 오류) | `null` | `"검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요"` | - 검색 결과 영역에 오류 메시지 박스 표시<br/>  - 빨간색 아이콘<br/>  - 오류 메시지 텍스트<br/>  - "다시 시도" 버튼<br/>- 기존 검색 결과는 유지 또는 제거 (UX 선택) |
| API 호출 실패 (서버 오류 500) | `null` | `"서버 오류가 발생했습니다"` | - 동일한 오류 UI<br/>- "다시 시도" 버튼 제공 |
| 재시도 버튼 클릭 (오류 초기화) | `"검색 중 오류가..."` | `null` | - 오류 메시지 박스 제거<br/>- 로딩 상태로 전환 (`isLoading: true`) |
| 새로운 검색 성공 (오류 클리어) | `"검색 중 오류가..."` | `null` | - 오류 메시지 제거<br/>- 정상 검색 결과 표시 |

---

### 3.6. currentPage 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `undefined` | `1` | - 첫 페이지 결과 표시 (1~10번 항목) |
| 페이지 번호 2 클릭 | `1` | `2` | - 두 번째 페이지 결과 표시 (11~20번 항목)<br/>- 페이지네이션에서 2번이 활성 상태로 하이라이트<br/>- 화면이 검색 결과 상단으로 스크롤 (선택적) |
| 페이지 번호 3 클릭 | `2` | `3` | - 세 번째 페이지 결과 표시 (21~30번 항목)<br/>- 페이지네이션에서 3번이 활성 상태 |
| 새로운 검색 수행 (페이지 리셋) | `3` | `1` | - 첫 페이지로 자동 리셋<br/>- 새로운 검색 결과의 첫 페이지 표시 |
| "이전" 버튼 클릭 | `3` | `2` | - 이전 페이지로 이동<br/>- 해당 페이지 결과 표시 |
| "다음" 버튼 클릭 | `2` | `3` | - 다음 페이지로 이동<br/>- 해당 페이지 결과 표시 |

---

## 4. 상태 전환 다이어그램

### 4.1. 검색 플로우 상태 전환

```
[초기 상태]
  ↓
searchForm: { reservationId: "", contact: "" }
validationErrors: { reservationId: null, contact: null }
searchResults: []
isLoading: false
error: null
currentPage: 1

  ↓ (사용자 입력)

[입력 중]
searchForm: { reservationId: "abc...", contact: "" }
validationErrors: (실시간 검증 결과)
  ↓
  ├─ 유효성 오류 있음 → validationErrors 업데이트 → 조회 버튼 비활성화
  └─ 유효성 통과 → validationErrors: null → 조회 버튼 활성화

  ↓ (조회 버튼 클릭)

[로딩 중]
isLoading: true
  - 조회 버튼 비활성화
  - 스피너 표시

  ↓ (API 응답)

[성공 - 결과 있음]
isLoading: false
searchResults: [{...}, {...}, ...]
error: null
  - 예약 카드 목록 표시
  - 페이지네이션 표시 (결과 > 10개)

[성공 - 결과 없음]
isLoading: false
searchResults: []
error: null
  - 빈 상태 UI 표시

[실패]
isLoading: false
searchResults: [] (또는 유지)
error: "오류 메시지"
  - 오류 메시지 + 재시도 버튼 표시
```

---

### 4.2. 페이지네이션 상태 전환

```
[1페이지 표시]
currentPage: 1
paginatedResults: searchResults[0:10]

  ↓ (페이지 2 클릭)

[2페이지 표시]
currentPage: 2
paginatedResults: searchResults[10:20]

  ↓ (페이지 3 클릭)

[3페이지 표시]
currentPage: 3
paginatedResults: searchResults[20:30]

  ↓ (새 검색)

[1페이지로 리셋]
currentPage: 1
paginatedResults: newSearchResults[0:10]
```

---

## 5. 상태 관리 전략

### 5.1. 상태 저장 위치

| 상태 | 저장 위치 | 이유 |
|-----|---------|------|
| `searchForm` | 컴포넌트 로컬 상태 (useState) | 단일 페이지에서만 사용, 다른 페이지와 공유 불필요 |
| `validationErrors` | 컴포넌트 로컬 상태 | 입력 검증은 UI 레이어에서 처리 |
| `searchResults` | React Query 캐시 | 서버 데이터, 캐싱 및 자동 재검증 필요 |
| `isLoading` | React Query 상태 | API 호출 상태는 React Query가 자동 관리 |
| `error` | React Query 상태 | API 오류도 React Query가 관리 |
| `currentPage` | 컴포넌트 로컬 상태 | UI 상태, 페이지 이동 시 리셋 |

---

### 5.2. React Query 사용 예시

```typescript
const useReservationSearch = (searchParams: SearchParams) => {
  return useQuery({
    queryKey: ['reservations', 'search', searchParams],
    queryFn: () => searchReservations(searchParams),
    enabled: false, // 수동 실행
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
  });
};

// 컴포넌트에서 사용
const {
  data: searchResults,
  isLoading,
  error,
  refetch
} = useReservationSearch({ reservationId, phone });
```

---

### 5.3. 상태 초기화 시점

| 시점 | 초기화할 상태 | 이유 |
|-----|-----------|------|
| 페이지 마운트 | 모든 상태 | 깨끗한 초기 상태 |
| 새 검색 시작 | `currentPage` → 1<br/>`error` → null | 새 검색 결과는 첫 페이지부터, 이전 오류 제거 |
| 페이지 언마운트 | React Query 캐시는 유지 | 뒤로가기 시 빠른 복원 |
| 입력 필드 변경 | `validationErrors` (해당 필드) | 실시간 검증 |

---

## 6. 상태 업데이트 함수

### 6.1. 검색 폼 관련

```typescript
// 입력 필드 변경
const handleReservationIdChange = (value: string) => {
  setSearchForm(prev => ({ ...prev, reservationId: value }));
  
  // 실시간 검증
  const error = validateReservationId(value);
  setValidationErrors(prev => ({ ...prev, reservationId: error }));
};

const handleContactChange = (value: string) => {
  setSearchForm(prev => ({ ...prev, contact: value }));
  
  // 실시간 검증
  const error = validateContact(value);
  setValidationErrors(prev => ({ ...prev, contact: error }));
};

// 폼 초기화
const resetForm = () => {
  setSearchForm({ reservationId: "", contact: "" });
  setValidationErrors({ reservationId: null, contact: null });
};
```

---

### 6.2. 검색 실행

```typescript
// 검색 요청
const handleSearch = async () => {
  // 최종 검증
  if (!searchForm.reservationId && !searchForm.contact) {
    setValidationErrors(prev => ({
      ...prev,
      reservationId: "예약 번호 또는 연락처를 입력해주세요"
    }));
    return;
  }
  
  // 페이지 리셋
  setCurrentPage(1);
  
  // React Query refetch
  await refetch();
};

// 재시도
const handleRetry = () => {
  refetch();
};
```

---

### 6.3. 페이지네이션

```typescript
// 페이지 변경
const handlePageChange = (page: number) => {
  setCurrentPage(page);
  
  // 선택적: 페이지 상단으로 스크롤
  window.scrollTo({ top: 0, behavior: 'smooth' });
};

// 이전 페이지
const handlePrevPage = () => {
  if (currentPage > 1) {
    setCurrentPage(prev => prev - 1);
  }
};

// 다음 페이지
const handleNextPage = () => {
  if (currentPage < totalPages) {
    setCurrentPage(prev => prev + 1);
  }
};
```

---

## 7. 상태 디버깅 가이드

### 7.1. React DevTools로 확인할 상태

```typescript
// 컴포넌트명: ReservationSearchPage
{
  searchForm: { reservationId: "...", contact: "..." },
  validationErrors: { ... },
  currentPage: 1
}

// React Query DevTools로 확인
Query: ['reservations', 'search', { ... }]
Status: loading | success | error
Data: Reservation[]
```

---

### 7.2. 상태 로깅

```typescript
// 개발 환경에서만 로깅
if (process.env.NODE_ENV === 'development') {
  console.log('Search Form:', searchForm);
  console.log('Validation Errors:', validationErrors);
  console.log('Search Results:', searchResults);
  console.log('Is Loading:', isLoading);
  console.log('Error:', error);
  console.log('Current Page:', currentPage);
}
```

---

## 8. 예상 시나리오별 상태 흐름

### 시나리오 1: 정상 검색 (예약 번호로 검색)

```
1. 초기 상태
   searchForm: { reservationId: "", contact: "" }
   
2. 예약 번호 입력
   searchForm: { reservationId: "abc-123-...", contact: "" }
   validationErrors: { reservationId: null, contact: null }
   
3. 조회 버튼 클릭
   isLoading: true
   
4. API 응답 수신
   isLoading: false
   searchResults: [{ id: "abc-123-...", ... }]
   
5. 화면 표시
   - 예약 카드 1개 표시
   - 페이지네이션 숨김 (결과 1개)
```

---

### 시나리오 2: 검색 결과 없음

```
1. 초기 상태
   searchForm: { reservationId: "", contact: "010-9999-9999" }
   
2. 조회 버튼 클릭
   isLoading: true
   
3. API 응답 수신 (빈 배열)
   isLoading: false
   searchResults: []
   
4. 화면 표시
   - 빈 상태 UI 표시
   - "검색 결과가 없습니다" 메시지
```

---

### 시나리오 3: 네트워크 오류 → 재시도

```
1. 초기 상태
   searchForm: { reservationId: "abc-123-...", contact: "" }
   
2. 조회 버튼 클릭
   isLoading: true
   
3. API 호출 실패
   isLoading: false
   error: "검색 중 오류가 발생했습니다..."
   
4. 화면 표시
   - 오류 메시지 박스
   - "다시 시도" 버튼
   
5. 재시도 버튼 클릭
   error: null
   isLoading: true
   
6. API 응답 수신 (성공)
   isLoading: false
   searchResults: [...]
```

---

### 시나리오 4: 다수 결과 + 페이지네이션

```
1. 초기 상태
   searchForm: { reservationId: "", contact: "010-1234-5678" }
   
2. API 응답 수신 (25개 결과)
   searchResults: [25개 예약]
   currentPage: 1
   
3. 화면 표시
   - paginatedResults: searchResults[0:10] (1~10번)
   - 페이지네이션 표시: [1] 2 3
   
4. 페이지 2 클릭
   currentPage: 2
   - paginatedResults: searchResults[10:20] (11~20번)
   - 페이지네이션: 1 [2] 3
   
5. 페이지 3 클릭
   currentPage: 3
   - paginatedResults: searchResults[20:25] (21~25번)
   - 페이지네이션: 1 2 [3]
```

---

## 9. 요약

### 9.1. 관리해야 할 상태 (6개)
1. `searchForm` - 검색 조건 입력
2. `validationErrors` - 입력 검증 오류
3. `searchResults` - 검색 결과 목록
4. `isLoading` - 로딩 상태
5. `error` - 오류 메시지
6. `currentPage` - 현재 페이지 번호

### 9.2. 상태가 아닌 것 (7개 + 상수)
1. `paginatedResults` - 파생 데이터
2. `totalPages` - 파생 데이터
3. `hasSearchResults` - 파생 데이터
4. `showEmptyState` - 파생 데이터
5. `showPagination` - 파생 데이터
6. `isSearchButtonDisabled` - 파생 데이터
7. `hasValidationErrors` - 파생 데이터
8. 포맷팅된 표시 데이터 (날짜, 좌석, 금액, 상태)
9. 상수 (ITEMS_PER_PAGE, ERROR_MESSAGES 등)

### 9.3. 핵심 원칙
- **최소한의 상태만 관리**: 파생 가능한 데이터는 상태로 저장하지 않음
- **단일 진실의 원천**: 각 데이터는 한 곳에서만 관리
- **명확한 상태 전환**: 각 상태 변경이 화면에 미치는 영향을 명확히 정의
- **예측 가능한 흐름**: 사용자 행동 → 상태 변경 → UI 업데이트의 흐름이 일관적

