# 상태 정의: 예약 상세 페이지 - 예약 조회 및 취소

## 문서 정보
- **기능 ID**: STATE-008
- **기능 명**: 예약 상세 페이지 상태 관리
- **관련 문서**: 
  - 요구사항: `/docs/pages/008/requirement.md`
  - 유스케이스: `/docs/pages/008/spec.md`
- **작성일**: 2025-10-15
- **버전**: 1.0

---

## 1. 관리해야 할 상태 데이터 목록

### 1.1. 예약 상세 정보 상태

#### `reservation`
- **타입**: `ReservationDetail | null`
- **초기값**: `null`
- **설명**: 서버에서 조회한 예약 상세 정보 (콘서트, 일정, 좌석 포함)
- **저장 위치**: 컴포넌트 로컬 상태 또는 React Query 캐시
- **변경 주체**: API 응답

```typescript
type ReservationDetail = {
  // 예약 기본 정보
  id: string;                       // 예약 ID (UUID)
  status: 'confirmed' | 'cancelled'; // 예약 상태
  customerName: string;             // 예약자 이름
  customerPhone: string;            // 예약자 휴대폰
  customerEmail: string | null;     // 예약자 이메일 (선택)
  totalPrice: number;               // 총 결제 금액
  createdAt: string;                // 예약 생성 일시 (ISO 8601)
  cancelledAt: string | null;       // 취소 일시 (취소된 경우)
  
  // 콘서트 정보
  concert: {
    id: string;
    title: string;                  // 콘서트 제목
    posterImageUrl: string;         // 포스터 이미지 URL
    description: string | null;     // 콘서트 설명
  };
  
  // 공연 일정 정보
  schedule: {
    id: string;
    dateTime: string;               // 공연 일시 (ISO 8601)
  };
  
  // 좌석 정보 배열
  seats: Array<{
    id: string;
    seatNumber: string;             // 좌석 번호 (예: "A01")
    grade: string;                  // 좌석 등급 (예: "R", "S", "A")
    price: number;                  // 좌석 가격
    status: 'available' | 'reserved'; // 좌석 상태
  }>;
};
```

---

### 1.2. 취소 가능 여부 상태

#### `canCancel`
- **타입**: `boolean`
- **초기값**: `false`
- **설명**: 예약 취소 가능 여부 (비즈니스 로직 계산 결과)
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 예약 정보 로드 시 계산 로직

```typescript
type CanCancelState = boolean;
```

---

#### `cancelReason`
- **타입**: `string | null`
- **초기값**: `null`
- **설명**: 취소 불가능 사유 (canCancel이 false일 때만 값 존재)
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 예약 정보 로드 시 계산 로직

```typescript
type CancelReasonState = string | null;

// 예시 값:
// - "이미 취소된 예약입니다"
// - "공연 시작 2시간 전까지만 취소 가능합니다"
// - "종료된 공연입니다"
```

---

### 1.3. UI 상태

#### `isLoading`
- **타입**: `boolean`
- **초기값**: `true`
- **설명**: 예약 정보 로딩 중 여부
- **저장 위치**: 컴포넌트 로컬 상태 또는 React Query 상태
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

// 예시 값:
// - "예약을 찾을 수 없습니다"
// - "예약 정보를 불러오는 중 오류가 발생했습니다"
// - "서버 오류가 발생했습니다"
```

---

#### `showCancelDialog`
- **타입**: `boolean`
- **초기값**: `false`
- **설명**: 예약 취소 확인 다이얼로그 표시 여부
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 사용자의 버튼 클릭 또는 다이얼로그 닫기

```typescript
type ShowCancelDialogState = boolean;
```

---

#### `isCancelling`
- **타입**: `boolean`
- **초기값**: `false`
- **설명**: 예약 취소 처리 중 여부
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 취소 API 호출 시작/완료

```typescript
type IsCancellingState = boolean;
```

---

#### `cancelSuccess`
- **타입**: `boolean`
- **초기값**: `false`
- **설명**: 예약 취소 성공 여부 (성공 메시지 표시용)
- **저장 위치**: 컴포넌트 로컬 상태
- **변경 주체**: 취소 API 호출 성공

```typescript
type CancelSuccessState = boolean;
```

---

### 1.4. 전체 상태 타입 정의

```typescript
type ReservationDetailPageState = {
  // 예약 정보
  reservation: ReservationDetail | null;
  
  // 취소 가능 여부
  canCancel: boolean;
  cancelReason: string | null;
  
  // UI 상태
  isLoading: boolean;
  error: string | null;
  showCancelDialog: boolean;
  isCancelling: boolean;
  cancelSuccess: boolean;
};
```

---

## 2. 화면상에 보여지지만 상태가 아닌 것

### 2.1. 파생(Derived) 데이터

이들은 기존 상태로부터 계산되는 값으로, 별도로 상태로 관리할 필요가 없습니다.

#### `isCancelled`
- **설명**: 예약이 취소된 상태인지 여부
- **계산 방법**:
  ```typescript
  const isCancelled = reservation?.status === 'cancelled';
  ```
- **의존 상태**: `reservation.status`

---

#### `isConfirmed`
- **설명**: 예약이 확정된 상태인지 여부
- **계산 방법**:
  ```typescript
  const isConfirmed = reservation?.status === 'confirmed';
  ```
- **의존 상태**: `reservation.status`

---

#### `showCancelButton`
- **설명**: 예약 취소 버튼 표시 여부
- **계산 방법**:
  ```typescript
  const showCancelButton = !isLoading && 
                          !error && 
                          reservation !== null &&
                          !isCancelling;
  ```
- **의존 상태**: `isLoading`, `error`, `reservation`, `isCancelling`

---

#### `isCancelButtonDisabled`
- **설명**: 예약 취소 버튼 비활성화 여부
- **계산 방법**:
  ```typescript
  const isCancelButtonDisabled = !canCancel || 
                                 isCancelled || 
                                 isCancelling;
  ```
- **의존 상태**: `canCancel`, `reservation.status`, `isCancelling`

---

#### `showCancelWarning`
- **설명**: 취소 불가 경고 메시지 표시 여부
- **계산 방법**:
  ```typescript
  const showCancelWarning = !canCancel && cancelReason !== null;
  ```
- **의존 상태**: `canCancel`, `cancelReason`

---

#### `showSuccessToast`
- **설명**: 취소 성공 토스트 메시지 표시 여부
- **계산 방법**:
  ```typescript
  const showSuccessToast = cancelSuccess && !isCancelling;
  ```
- **의존 상태**: `cancelSuccess`, `isCancelling`

---

#### `hoursUntilShow`
- **설명**: 공연 시작까지 남은 시간 (시간 단위)
- **계산 방법**:
  ```typescript
  const hoursUntilShow = reservation?.schedule.dateTime
    ? (new Date(reservation.schedule.dateTime).getTime() - Date.now()) / (1000 * 60 * 60)
    : 0;
  ```
- **의존 데이터**: `reservation.schedule.dateTime`

---

#### `isShowEnded`
- **설명**: 공연이 이미 종료되었는지 여부
- **계산 방법**:
  ```typescript
  const isShowEnded = reservation?.schedule.dateTime
    ? new Date(reservation.schedule.dateTime) < new Date()
    : false;
  ```
- **의존 데이터**: `reservation.schedule.dateTime`

---

### 2.2. 포맷팅된 표시 데이터

#### `formattedScheduleDateTime`
- **설명**: 형식화된 공연 일시 (예: "2025년 12월 25일 (수) 19:00")
- **계산 방법**:
  ```typescript
  import { format } from 'date-fns';
  import { ko } from 'date-fns/locale';
  
  const formattedScheduleDateTime = reservation?.schedule.dateTime
    ? format(
        new Date(reservation.schedule.dateTime), 
        'yyyy년 MM월 dd일 (eee) HH:mm', 
        { locale: ko }
      )
    : '';
  ```
- **의존 데이터**: `reservation.schedule.dateTime`

---

#### `formattedCreatedAt`
- **설명**: 형식화된 예약 생성 일시 (예: "2025년 10월 15일 10:30")
- **계산 방법**:
  ```typescript
  const formattedCreatedAt = reservation?.createdAt
    ? format(
        new Date(reservation.createdAt), 
        'yyyy년 MM월 dd일 HH:mm', 
        { locale: ko }
      )
    : '';
  ```
- **의존 데이터**: `reservation.createdAt`

---

#### `formattedCancelledAt`
- **설명**: 형식화된 취소 일시 (예: "2025년 10월 15일 14:20")
- **계산 방법**:
  ```typescript
  const formattedCancelledAt = reservation?.cancelledAt
    ? format(
        new Date(reservation.cancelledAt), 
        'yyyy년 MM월 dd일 HH:mm', 
        { locale: ko }
      )
    : null;
  ```
- **의존 데이터**: `reservation.cancelledAt`

---

#### `formattedTotalPrice`
- **설명**: 형식화된 총 금액 (예: "300,000원")
- **계산 방법**:
  ```typescript
  const formattedTotalPrice = reservation?.totalPrice
    ? new Intl.NumberFormat('ko-KR').format(reservation.totalPrice) + '원'
    : '';
  ```
- **의존 데이터**: `reservation.totalPrice`

---

#### `formattedSeats`
- **설명**: 형식화된 좌석 정보 (예: "A01 (R석) - 150,000원")
- **계산 방법**:
  ```typescript
  const formattedSeats = reservation?.seats.map(seat => ({
    seatNumber: seat.seatNumber,
    gradeText: `${seat.seatNumber} (${seat.grade}석)`,
    priceText: new Intl.NumberFormat('ko-KR').format(seat.price) + '원',
    fullText: `${seat.seatNumber} (${seat.grade}석) - ${new Intl.NumberFormat('ko-KR').format(seat.price)}원`
  })) || [];
  ```
- **의존 데이터**: `reservation.seats`

---

#### `seatCount`
- **설명**: 예약한 총 좌석 수
- **계산 방법**:
  ```typescript
  const seatCount = reservation?.seats.length || 0;
  ```
- **의존 데이터**: `reservation.seats`

---

#### `seatsSummary`
- **설명**: 좌석 요약 (예: "A01, A02 (2석)")
- **계산 방법**:
  ```typescript
  const seatsSummary = reservation?.seats
    ? `${reservation.seats.map(s => s.seatNumber).join(', ')} (${reservation.seats.length}석)`
    : '';
  ```
- **의존 데이터**: `reservation.seats`

---

#### `statusBadge`
- **설명**: 예약 상태 뱃지 정보 (텍스트, 색상, 아이콘)
- **계산 방법**:
  ```typescript
  const statusBadge = {
    text: reservation?.status === 'confirmed' ? '확정' : '취소됨',
    variant: reservation?.status === 'confirmed' ? 'success' : 'default',
    bgColor: reservation?.status === 'confirmed' ? 'bg-green-100' : 'bg-gray-100',
    textColor: reservation?.status === 'confirmed' ? 'text-green-800' : 'text-gray-600',
    icon: reservation?.status === 'confirmed' ? 'CheckCircle' : 'XCircle'
  };
  ```
- **의존 데이터**: `reservation.status`

---

### 2.3. 상수 데이터

#### 비즈니스 로직 상수
```typescript
const CANCELLATION_DEADLINE_HOURS = 2;  // 공연 2시간 전까지 취소 가능
```

#### UI 텍스트 상수
```typescript
const TEXTS = {
  pageTitle: "예약 상세 정보",
  cancelButton: "예약 취소하기",
  backButton: "목록으로 돌아가기",
  
  dialogTitle: "예약을 취소하시겠습니까?",
  dialogWarning: "취소된 좌석은 다른 사용자가 예매할 수 있으며, 이 작업은 되돌릴 수 없습니다.",
  dialogConfirm: "확인",
  dialogCancel: "취소",
  
  successMessage: "예약이 성공적으로 취소되었습니다",
  
  sections: {
    customerInfo: "예약자 정보",
    concertInfo: "관람 정보",
    seatInfo: "좌석 정보",
    paymentInfo: "결제 정보"
  },
  
  labels: {
    reservationId: "예약번호",
    status: "예약상태",
    name: "이름",
    phone: "연락처",
    email: "이메일",
    dateTime: "일시",
    venue: "장소",
    totalPrice: "총 금액",
    createdAt: "예약 일시",
    cancelledAt: "취소 일시"
  }
};
```

#### 오류 메시지 상수
```typescript
const ERROR_MESSAGES = {
  notFound: "예약을 찾을 수 없습니다",
  loadFailed: "예약 정보를 불러오는 중 오류가 발생했습니다",
  cancelFailed: "예약 취소 중 오류가 발생했습니다",
  alreadyCancelled: "이미 취소된 예약입니다",
  cannotCancel: "예약을 취소할 수 없습니다",
  serverError: "서버 오류가 발생했습니다"
};
```

#### 취소 불가 사유 메시지
```typescript
const CANCEL_REASON_MESSAGES = {
  alreadyCancelled: "이미 취소된 예약입니다",
  showStartsSoon: "공연 시작 2시간 전까지만 취소 가능합니다",
  showEnded: "종료된 공연입니다"
};
```

---

## 3. 상태 변경 조건 및 화면 변화

### 3.1. reservation 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `null` | `null` | - 스켈레톤 UI 표시<br/>- 모든 섹션이 로딩 상태 |
| API 조회 성공 (확정 예약) | `null` | `{ id: "...", status: "confirmed", ... }` | - 스켈레톤 UI 제거<br/>- 예약 정보 전체 표시<br/>- "확정" 배지 표시 (초록색)<br/>- 취소 버튼 활성화 (canCancel에 따라) |
| API 조회 성공 (취소된 예약) | `null` | `{ id: "...", status: "cancelled", cancelledAt: "...", ... }` | - 스켈레톤 UI 제거<br/>- 예약 정보 전체 표시<br/>- "취소됨" 배지 표시 (회색)<br/>- 취소 일시 표시<br/>- 취소 버튼 비활성화 |
| 취소 처리 성공 후 | `{ ..., status: "confirmed", cancelledAt: null }` | `{ ..., status: "cancelled", cancelledAt: "2025-10-15T14:20:00+09:00" }` | - 예약 상태 배지: "확정" → "취소됨"<br/>- 배지 색상: 초록색 → 회색<br/>- 취소 일시 표시 추가<br/>- 취소 버튼 비활성화<br/>- 성공 토스트 메시지 표시 |

---

### 3.2. canCancel 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `false` | `false` | - 취소 버튼 비활성화 (회색) |
| 예약 정보 로드 (취소 가능) | `false` | `true` | - 취소 버튼 활성화 (빨간색)<br/>- 호버 시 더 진한 빨간색<br/>- 클릭 가능 상태 |
| 예약 정보 로드 (취소 불가 - 이미 취소) | `false` | `false` | - 취소 버튼 비활성화 유지<br/>- "이미 취소된 예약입니다" 메시지 표시 |
| 예약 정보 로드 (취소 불가 - 공연 임박) | `false` | `false` | - 취소 버튼 비활성화 유지<br/>- "공연 시작 2시간 전까지만 취소 가능합니다" 경고 메시지<br/>- 주황색 경고 아이콘<br/>- 고객센터 연락처 표시 |
| 예약 정보 로드 (취소 불가 - 공연 종료) | `false` | `false` | - 취소 버튼 비활성화 유지<br/>- "종료된 공연입니다" 안내 메시지 |
| 취소 처리 완료 후 | `true` | `false` | - 취소 버튼 비활성화<br/>- canCancel이 false로 변경되어 재취소 방지 |

---

### 3.3. cancelReason 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `null` | `null` | - 경고 메시지 표시 안됨 |
| 예약 정보 로드 (취소 가능) | `null` | `null` | - 경고 메시지 표시 안됨<br/>- 취소 버튼만 활성화 |
| 예약 정보 로드 (이미 취소됨) | `null` | `"이미 취소된 예약입니다"` | - 취소 버튼 위/아래에 안내 메시지 표시<br/>- 회색 배경의 정보 박스 |
| 예약 정보 로드 (공연 임박) | `null` | `"공연 시작 2시간 전까지만 취소 가능합니다"` | - 주황색 경고 박스 표시<br/>- 경고 아이콘 (AlertTriangle)<br/>- "긴급 문의: 고객센터 1234-5678" 추가 정보 |
| 예약 정보 로드 (공연 종료) | `null` | `"종료된 공연입니다"` | - 회색 정보 박스 표시<br/>- 정보 아이콘 (Info)<br/>- "취소는 불가능합니다" 안내 |

---

### 3.4. isLoading 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 마운트 (API 호출 전) | `undefined` | `true` | - 전체 페이지에 스켈레톤 UI 표시<br/>  - 예약 번호 영역: 회색 박스<br/>  - 콘서트 포스터: 회색 사각형<br/>  - 정보 섹션들: 회색 라인들<br/>  - 버튼: 비활성화 상태 |
| API 응답 수신 (성공/실패) | `true` | `false` | - 스켈레톤 UI 제거<br/>- 실제 데이터 또는 오류 UI로 전환<br/>- 애니메이션 효과 (fade-in) |

---

### 3.5. error 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `undefined` | `null` | - 오류 UI 표시 안됨 |
| API 조회 실패 (404) | `null` | `"예약을 찾을 수 없습니다"` | - 전체 페이지를 오류 상태로 대체<br/>  - 큰 오류 아이콘 (AlertCircle)<br/>  - 오류 메시지 표시<br/>  - "목록으로 돌아가기" 버튼<br/>  - "다시 시도" 버튼 |
| API 조회 실패 (네트워크) | `null` | `"예약 정보를 불러오는 중 오류가 발생했습니다"` | - 동일한 오류 UI<br/>- "다시 시도" 버튼 강조 |
| API 조회 실패 (500) | `null` | `"서버 오류가 발생했습니다"` | - 동일한 오류 UI<br/>- 고객센터 연락처 추가 표시 |
| 재시도 버튼 클릭 | `"예약 정보를..."` | `null` | - 오류 UI 제거<br/>- 로딩 상태로 전환 (`isLoading: true`) |
| API 조회 성공 | `"예약 정보를..."` | `null` | - 오류 UI 제거<br/>- 정상 예약 정보 표시 |

---

### 3.6. showCancelDialog 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `undefined` | `false` | - 다이얼로그 표시 안됨 |
| "예약 취소하기" 버튼 클릭 | `false` | `true` | - 취소 확인 다이얼로그 모달 표시<br/>  - 반투명 오버레이 배경<br/>  - 다이얼로그 중앙 배치<br/>  - 예약 정보 요약 표시<br/>  - 경고 메시지<br/>  - "취소" 및 "확인" 버튼<br/>- 배경 페이지 스크롤 잠김 |
| 다이얼로그에서 "취소" 버튼 클릭 | `true` | `false` | - 다이얼로그 페이드아웃 애니메이션<br/>- 오버레이 제거<br/>- 배경 페이지 스크롤 복원<br/>- 원래 상태 유지 (예약 취소 안됨) |
| 다이얼로그에서 "확인" 버튼 클릭 | `true` | `false` | - 다이얼로그 즉시 닫힘<br/>- `isCancelling` 상태 `true`로 변경<br/>- 취소 API 호출 시작 |
| 다이얼로그 외부 클릭 (닫기) | `true` | `false` | - 다이얼로그 닫힘<br/>- 원래 상태 유지 |

---

### 3.7. isCancelling 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `undefined` | `false` | - 취소 처리 중 UI 표시 안됨 |
| 다이얼로그에서 "확인" 클릭 (취소 시작) | `false` | `true` | - 다이얼로그 닫힘<br/>- 취소 버튼이 로딩 상태로 변경<br/>  - 버튼 내부에 스피너 표시<br/>  - 버튼 텍스트 "취소 중..." 또는 스피너만<br/>  - 버튼 비활성화 (회색)<br/>- 전체 페이지 비활성화 (선택적)<br/>- 커서 `wait` 상태 |
| 취소 API 응답 수신 (성공/실패) | `true` | `false` | - 스피너 제거<br/>- 버튼 정상 상태로 복원<br/>- 전체 페이지 활성화<br/>- 성공 시: `cancelSuccess: true`<br/>- 실패 시: 오류 토스트 표시 |

---

### 3.8. cancelSuccess 상태 변경

| 변경 조건 | 이전 값 | 변경 후 값 | 화면 변화 |
|---------|--------|----------|----------|
| 페이지 초기 로드 | `undefined` | `false` | - 성공 메시지 표시 안됨 |
| 취소 API 성공 | `false` | `true` | - 화면 우측 상단에 성공 토스트 표시<br/>  - 초록색 배경<br/>  - 체크마크 아이콘<br/>  - "예약이 성공적으로 취소되었습니다" 메시지<br/>  - 3초 후 자동 사라짐<br/>- 예약 상태가 "취소됨"으로 업데이트<br/>- 취소 버튼 비활성화 |
| 토스트 자동 사라짐 (3초 후) | `true` | `false` | - 토스트 메시지 페이드아웃<br/>- 취소된 예약 상태는 유지 |

---

## 4. 상태 전환 다이어그램

### 4.1. 예약 조회 플로우 상태 전환

```
[초기 상태]
  ↓
reservation: null
canCancel: false
cancelReason: null
isLoading: true
error: null
showCancelDialog: false
isCancelling: false
cancelSuccess: false

  ↓ (페이지 마운트, API 호출)

[로딩 중]
isLoading: true
  - 스켈레톤 UI 표시

  ↓ (API 응답)

[성공 - 취소 가능한 예약]
isLoading: false
reservation: { status: "confirmed", ... }
canCancel: true
cancelReason: null
  - 예약 정보 전체 표시
  - 취소 버튼 활성화 (빨간색)

[성공 - 취소 불가능 (공연 임박)]
isLoading: false
reservation: { status: "confirmed", ... }
canCancel: false
cancelReason: "공연 시작 2시간 전까지만..."
  - 예약 정보 표시
  - 취소 버튼 비활성화
  - 경고 메시지 표시

[성공 - 이미 취소된 예약]
isLoading: false
reservation: { status: "cancelled", cancelledAt: "...", ... }
canCancel: false
cancelReason: "이미 취소된 예약입니다"
  - 취소된 상태로 표시
  - 취소 일시 표시
  - 취소 버튼 비활성화

[실패]
isLoading: false
reservation: null
error: "오류 메시지"
  - 오류 UI 표시
  - 재시도/목록으로 버튼
```

---

### 4.2. 예약 취소 플로우 상태 전환

```
[취소 가능 상태]
reservation: { status: "confirmed", ... }
canCancel: true
showCancelDialog: false

  ↓ ("예약 취소하기" 버튼 클릭)

[다이얼로그 표시]
showCancelDialog: true
  - 취소 확인 다이얼로그 모달 표시
  - 예약 정보 요약
  - 경고 메시지

  ↓ (다이얼로그에서 "확인" 클릭)

[취소 처리 중]
showCancelDialog: false
isCancelling: true
  - 다이얼로그 닫힘
  - 취소 버튼 로딩 상태
  - 스피너 표시
  - 페이지 비활성화

  ↓ (취소 API 응답)

[취소 성공]
isCancelling: false
cancelSuccess: true
reservation: { status: "cancelled", cancelledAt: "...", ... }
canCancel: false
  - 성공 토스트 메시지 (3초)
  - 예약 상태 "취소됨"으로 변경
  - 취소 일시 표시
  - 취소 버튼 비활성화

[취소 실패]
isCancelling: false
error: "취소 실패 메시지"
  - 오류 토스트 메시지
  - 재시도 옵션
  - 예약 상태는 "확정" 유지


[다이얼로그 취소]
("취소" 버튼 클릭 또는 외부 클릭)
  ↓
showCancelDialog: false
  - 다이얼로그 닫힘
  - 원래 상태로 복귀
  - 예약 취소 안됨
```

---

### 4.3. 동시 취소 요청 충돌 시나리오

```
[Tab 1: 취소 시작]
isCancelling: true
  ↓
[서버: 트랜잭션 시작, 락 획득]
  ↓
[서버: 예약 상태 업데이트]
  ↓
[서버: 좌석 상태 복원]
  ↓
[서버: 커밋]
  ↓
[Tab 1: 취소 완료]
reservation.status: "cancelled"
cancelSuccess: true


[Tab 2: 동시 취소 시도]
isCancelling: true
  ↓
[서버: 트랜잭션 시작, 락 대기]
  ↓
[서버: 락 획득 (Tab 1 커밋 후)]
  ↓
[서버: 예약 상태 확인 → "cancelled"]
  ↓
[서버: 409 Conflict 응답]
  ↓
[Tab 2: 오류 처리]
error: "이미 처리된 예약입니다"
  ↓
[Tab 2: 자동 새로고침]
  ↓
[Tab 2: 최신 상태 반영]
reservation.status: "cancelled"
```

---

## 5. 상태 관리 전략

### 5.1. 상태 저장 위치

| 상태 | 저장 위치 | 이유 |
|-----|---------|------|
| `reservation` | React Query 캐시 | 서버 데이터, 캐싱 및 자동 재검증 필요 |
| `canCancel` | 컴포넌트 로컬 상태 (파생) | reservation으로부터 계산 가능 |
| `cancelReason` | 컴포넌트 로컬 상태 (파생) | reservation으로부터 계산 가능 |
| `isLoading` | React Query 상태 | API 호출 상태는 React Query가 자동 관리 |
| `error` | React Query 상태 | API 오류도 React Query가 관리 |
| `showCancelDialog` | 컴포넌트 로컬 상태 (useState) | UI 상태, 로컬에서만 관리 |
| `isCancelling` | 컴포넌트 로컬 상태 (useState) | 취소 API 호출 상태, 로컬 관리 |
| `cancelSuccess` | 컴포넌트 로컬 상태 (useState) | 토스트 표시용 임시 상태 |

---

### 5.2. React Query 사용 예시

```typescript
// 예약 상세 조회 Hook
const useReservationDetail = (reservationId: string) => {
  return useQuery({
    queryKey: ['reservation', reservationId],
    queryFn: () => fetchReservationDetail(reservationId),
    enabled: !!reservationId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    retry: 3,
    retryDelay: 1000,
  });
};

// 예약 취소 Mutation Hook
const useCancelReservation = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (reservationId: string) => cancelReservation(reservationId),
    onSuccess: (data, reservationId) => {
      // 캐시 업데이트
      queryClient.setQueryData(['reservation', reservationId], data);
      
      // 또는 캐시 무효화 (재조회)
      queryClient.invalidateQueries(['reservation', reservationId]);
    },
  });
};

// 컴포넌트에서 사용
const ReservationDetailPage = ({ params }: { params: Promise<{ id: string }> }) => {
  const resolvedParams = use(params);
  const reservationId = resolvedParams.id;
  
  // 조회
  const {
    data: reservation,
    isLoading,
    error,
    refetch
  } = useReservationDetail(reservationId);
  
  // 취소
  const {
    mutate: cancelReservation,
    isPending: isCancelling
  } = useCancelReservation();
  
  // 로컬 상태
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  
  // ...
};
```

---

### 5.3. 취소 가능 여부 계산 로직

```typescript
// 취소 가능 여부 및 사유 계산
const calculateCancellability = (
  reservation: ReservationDetail | null
): { canCancel: boolean; cancelReason: string | null } => {
  if (!reservation) {
    return { canCancel: false, cancelReason: null };
  }
  
  // 1. 이미 취소된 예약
  if (reservation.status === 'cancelled') {
    return {
      canCancel: false,
      cancelReason: '이미 취소된 예약입니다'
    };
  }
  
  // 2. 공연 시작 시간 확인
  const scheduleDateTime = new Date(reservation.schedule.dateTime);
  const now = new Date();
  const hoursUntilShow = (scheduleDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // 공연이 이미 종료됨
  if (scheduleDateTime < now) {
    return {
      canCancel: false,
      cancelReason: '종료된 공연입니다'
    };
  }
  
  // 공연 시작 2시간 이내
  if (hoursUntilShow < 2) {
    return {
      canCancel: false,
      cancelReason: '공연 시작 2시간 전까지만 취소 가능합니다'
    };
  }
  
  // 취소 가능
  return { canCancel: true, cancelReason: null };
};

// 컴포넌트에서 사용
const { canCancel, cancelReason } = useMemo(
  () => calculateCancellability(reservation),
  [reservation]
);
```

---

### 5.4. 상태 초기화 시점

| 시점 | 초기화할 상태 | 이유 |
|-----|-----------|------|
| 페이지 마운트 | 모든 로컬 상태 | 깨끗한 초기 상태 |
| 취소 성공 후 3초 | `cancelSuccess: false` | 토스트 메시지 자동 제거 |
| 페이지 언마운트 | React Query 캐시는 유지 | 뒤로가기 시 빠른 복원 |
| 다이얼로그 닫기 | `showCancelDialog: false` | UI 상태 정리 |
| 재시도 버튼 클릭 | `error: null` | 이전 오류 제거 |

---

## 6. 상태 업데이트 함수

### 6.1. 예약 취소 관련

```typescript
// 취소 버튼 클릭
const handleCancelButtonClick = () => {
  if (!canCancel) return;
  setShowCancelDialog(true);
};

// 다이얼로그 취소
const handleDialogCancel = () => {
  setShowCancelDialog(false);
};

// 다이얼로그 확인 (취소 실행)
const handleDialogConfirm = async () => {
  setShowCancelDialog(false);
  
  try {
    await cancelReservation(reservationId);
    setCancelSuccess(true);
    
    // 3초 후 성공 메시지 제거
    setTimeout(() => {
      setCancelSuccess(false);
    }, 3000);
  } catch (error) {
    // 오류 처리는 React Query의 onError에서
  }
};
```

---

### 6.2. 오류 처리

```typescript
// 재시도
const handleRetry = () => {
  refetch();
};

// 목록으로 돌아가기
const handleBackToList = () => {
  router.push('/reservations');
};
```

---

## 7. 상태 디버깅 가이드

### 7.1. React DevTools로 확인할 상태

```typescript
// 컴포넌트명: ReservationDetailPage
{
  showCancelDialog: false,
  cancelSuccess: false
}

// React Query DevTools로 확인
Query: ['reservation', reservationId]
Status: loading | success | error
Data: ReservationDetail | undefined
```

---

### 7.2. 상태 로깅

```typescript
// 개발 환경에서만 로깅
useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    console.group('🔍 Reservation Detail State');
    console.log('Reservation:', reservation);
    console.log('Can Cancel:', canCancel);
    console.log('Cancel Reason:', cancelReason);
    console.log('Is Loading:', isLoading);
    console.log('Error:', error);
    console.log('Show Cancel Dialog:', showCancelDialog);
    console.log('Is Cancelling:', isCancelling);
    console.log('Cancel Success:', cancelSuccess);
    console.groupEnd();
  }
}, [reservation, canCancel, cancelReason, isLoading, error, showCancelDialog, isCancelling, cancelSuccess]);
```

---

## 8. 예상 시나리오별 상태 흐름

### 시나리오 1: 정상 조회 및 취소

```
1. 페이지 마운트
   isLoading: true
   
2. API 응답 수신
   reservation: { status: "confirmed", ... }
   canCancel: true
   cancelReason: null
   isLoading: false
   
3. 사용자가 취소 버튼 클릭
   showCancelDialog: true
   
4. 다이얼로그에서 "확인" 클릭
   showCancelDialog: false
   isCancelling: true
   
5. 취소 API 응답
   isCancelling: false
   cancelSuccess: true
   reservation.status: "cancelled"
   reservation.cancelledAt: "2025-10-15T14:20:00+09:00"
   canCancel: false
   
6. 3초 후
   cancelSuccess: false
```

---

### 시나리오 2: 취소 불가능 (공연 임박)

```
1. 페이지 마운트
   isLoading: true
   
2. API 응답 수신
   reservation: { status: "confirmed", schedule: { dateTime: "1.5시간 후" }, ... }
   canCancel: false
   cancelReason: "공연 시작 2시간 전까지만 취소 가능합니다"
   isLoading: false
   
3. 화면 표시
   - 예약 정보 표시
   - 취소 버튼 비활성화 (회색)
   - 주황색 경고 메시지 박스
   - 고객센터 연락처
```

---

### 시나리오 3: 이미 취소된 예약 조회

```
1. 페이지 마운트
   isLoading: true
   
2. API 응답 수신
   reservation: { status: "cancelled", cancelledAt: "...", ... }
   canCancel: false
   cancelReason: "이미 취소된 예약입니다"
   isLoading: false
   
3. 화면 표시
   - "취소됨" 배지 (회색)
   - 취소 일시 표시
   - 취소 버튼 비활성화
   - 회색 안내 메시지
```

---

### 시나리오 4: 네트워크 오류 → 재시도

```
1. 페이지 마운트
   isLoading: true
   
2. API 호출 실패
   isLoading: false
   error: "예약 정보를 불러오는 중 오류가 발생했습니다"
   
3. 화면 표시
   - 오류 아이콘
   - 오류 메시지
   - "다시 시도" 버튼
   - "목록으로 돌아가기" 버튼
   
4. 재시도 버튼 클릭
   error: null
   isLoading: true
   
5. API 응답 수신 (성공)
   isLoading: false
   reservation: { ... }
```

---

### 시나리오 5: 동시 취소 요청 충돌

```
[Tab 1]
1. 취소 요청
   isCancelling: true
   
2. 서버에서 처리 완료
   isCancelling: false
   cancelSuccess: true
   reservation.status: "cancelled"

[Tab 2]
1. 동시 취소 요청
   isCancelling: true
   
2. 서버에서 409 응답
   isCancelling: false
   error: "이미 처리된 예약입니다"
   
3. 자동 페이지 새로고침
   isLoading: true
   error: null
   
4. 최신 상태 반영
   reservation.status: "cancelled"
   canCancel: false
```

---

## 9. 요약

### 9.1. 관리해야 할 상태 (8개)

#### 서버 데이터 (1개)
1. `reservation` - 예약 상세 정보 (React Query 캐시)

#### 파생 상태 (2개)
2. `canCancel` - 취소 가능 여부 (계산됨)
3. `cancelReason` - 취소 불가 사유 (계산됨)

#### API 상태 (2개)
4. `isLoading` - 조회 로딩 (React Query)
5. `error` - 조회 오류 (React Query)

#### 로컬 UI 상태 (3개)
6. `showCancelDialog` - 다이얼로그 표시 여부
7. `isCancelling` - 취소 처리 중 여부
8. `cancelSuccess` - 취소 성공 여부 (토스트용)

---

### 9.2. 상태가 아닌 것 (13개 + 상수)

#### 파생 데이터 (7개)
1. `isCancelled` - 취소 여부 확인
2. `isConfirmed` - 확정 여부 확인
3. `showCancelButton` - 버튼 표시 여부
4. `isCancelButtonDisabled` - 버튼 비활성화 여부
5. `showCancelWarning` - 경고 메시지 표시
6. `hoursUntilShow` - 공연까지 남은 시간
7. `isShowEnded` - 공연 종료 여부

#### 포맷팅 데이터 (6개)
8. `formattedScheduleDateTime` - 형식화된 공연 일시
9. `formattedCreatedAt` - 형식화된 예약 일시
10. `formattedCancelledAt` - 형식화된 취소 일시
11. `formattedTotalPrice` - 형식화된 총 금액
12. `formattedSeats` - 형식화된 좌석 정보
13. `statusBadge` - 상태 배지 정보

#### 상수
- `CANCELLATION_DEADLINE_HOURS`
- `TEXTS` (UI 텍스트)
- `ERROR_MESSAGES` (오류 메시지)
- `CANCEL_REASON_MESSAGES` (취소 사유)

---

### 9.3. 핵심 원칙

- **최소한의 상태만 관리**: 파생 가능한 데이터는 상태로 저장하지 않음
- **단일 진실의 원천**: 예약 데이터는 React Query 캐시에서만 관리
- **명확한 상태 전환**: 각 상태 변경이 화면에 미치는 영향을 명확히 정의
- **예측 가능한 흐름**: 사용자 행동 → 상태 변경 → UI 업데이트의 흐름이 일관적
- **트랜잭션 안정성**: 동시 취소 요청 시 충돌 방지 및 명확한 오류 처리

