# 요구사항 명세서: 예약 상세 페이지 - 예약 조회 및 취소

## 문서 정보
- **기능 ID**: REQ-008
- **기능 명**: 예약 상세 조회 및 취소 처리
- **관련 유저플로우**: #8
- **작성일**: 2025-10-15
- **버전**: 1.0

---

## 1. 기능 개요

### 1.1. 목적
사용자가 자신의 예약 상세 정보를 확인하고, 취소 정책에 따라 예약을 취소할 수 있는 기능을 제공합니다. 예약 취소 시 좌석 상태가 자동으로 복원되어 다른 사용자가 다시 예매할 수 있도록 합니다.

### 1.2. 범위
- 예약 상세 정보 조회 및 표시
- 취소 가능 여부 판단 (공연 시간 기준)
- 예약 취소 확인 다이얼로그
- 트랜잭션 기반 예약 취소 처리
- 좌석 상태 자동 복원

### 1.3. 사용자 시나리오
```
사용자가 예약 조회 페이지에서 자신의 예약을 찾아 카드를 클릭합니다.
예약 상세 페이지에서 콘서트 정보, 관람 일시, 좌석 정보를 확인한 후,
일정이 변경되어 예약을 취소하기로 결정합니다.
'예약 취소하기' 버튼을 클릭하고 확인 다이얼로그에서 '확인'을 선택하면,
예약이 즉시 취소되고 선택했던 좌석이 다시 예매 가능한 상태로 돌아갑니다.
```

---

## 2. 화면 구성 및 UI 요소

### 2.1. 페이지 레이아웃
```
┌─────────────────────────────────────────┐
│ 헤더 (Navigation Bar)                    │
├─────────────────────────────────────────┤
│                                         │
│  ← 목록으로                              │
│                                         │
│  예약 상세 정보                          │
│  ═════════════════════════════════      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ 예약번호: a1b2c3d4-...            │ │
│  │ 예약상태: [확정] 또는 [취소됨]    │ │
│  └───────────────────────────────────┘ │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │ [콘서트 포스터 이미지]            │ │
│  │                                   │ │
│  │ 아이유 콘서트 2024                │ │
│  └───────────────────────────────────┘ │
│                                         │
│  예약자 정보                             │
│  ─────────────────────────────────      │
│  이름: 홍길동                            │
│  연락처: 010-1234-5678                  │
│  이메일: hong@example.com               │
│                                         │
│  관람 정보                               │
│  ─────────────────────────────────      │
│  일시: 2025년 12월 25일 (수) 19:00      │
│  장소: 올림픽공원 체조경기장             │
│                                         │
│  좌석 정보                               │
│  ─────────────────────────────────      │
│  ┌─────────────────────────────────┐   │
│  │ A01 (R석) - 150,000원          │   │
│  │ A02 (R석) - 150,000원          │   │
│  └─────────────────────────────────┘   │
│                                         │
│  결제 정보                               │
│  ─────────────────────────────────      │
│  총 금액: 300,000원                     │
│  예약 일시: 2025년 10월 15일 10:30      │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │      [예약 취소하기]              │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘

[취소 확인 다이얼로그]
┌─────────────────────────────────────────┐
│  예약을 취소하시겠습니까?                │
│                                         │
│  콘서트: 아이유 콘서트 2024              │
│  일시: 2025년 12월 25일 19:00           │
│  좌석: A01, A02 (2석)                   │
│                                         │
│  취소된 좌석은 다른 사용자가 예매할 수   │
│  있으며, 이 작업은 되돌릴 수 없습니다.   │
│                                         │
│     [취소]        [확인]                │
└─────────────────────────────────────────┘
```

### 2.2. UI 컴포넌트 명세

#### 2.2.1. 예약 상태 배지
- **타입**: Badge Component
- **상태별 스타일**:
  - 확정 (`confirmed`):
    - 배경: 초록색 (`bg-green-100`)
    - 텍스트: 진한 초록색 (`text-green-800`)
    - 아이콘: 체크마크
  - 취소됨 (`cancelled`):
    - 배경: 회색 (`bg-gray-100`)
    - 텍스트: 진한 회색 (`text-gray-600`)
    - 아이콘: X 마크

#### 2.2.2. 콘서트 정보 섹션
- **콘서트 포스터**: 이미지 (400x600px, 반응형)
- **콘서트 제목**: 제목 텍스트 (H2, 굵은 글씨)
- **콘서트 설명**: 설명 텍스트 (선택사항)

#### 2.2.3. 예약자 정보 섹션
- **이름**: 텍스트 표시
- **연락처**: 휴대폰 번호 (010-XXXX-XXXX 형식)
- **이메일**: 이메일 주소 (입력했을 경우만 표시)

#### 2.2.4. 관람 정보 섹션
- **일시**: 
  - 포맷: `YYYY년 MM월 DD일 (요일) HH:MM`
  - 예: "2025년 12월 25일 (수) 19:00"
- **장소**: 공연장 이름 및 위치

#### 2.2.5. 좌석 정보 섹션
- **좌석 목록**: 각 좌석별로 카드 형태 표시
  - 좌석 번호 (예: "A01")
  - 좌석 등급 (예: "R석")
  - 좌석 가격 (통화 형식: "150,000원")

#### 2.2.6. 결제 정보 섹션
- **총 금액**: 통화 형식 (예: "300,000원")
- **예약 일시**: 
  - 포맷: `YYYY년 MM월 DD일 HH:MM`
- **취소 일시** (취소된 경우만):
  - 포맷: `YYYY년 MM월 DD일 HH:MM`

#### 2.2.7. 예약 취소하기 버튼
- **타입**: Primary Button
- **상태별 동작**:
  - **활성화** (취소 가능):
    - 배경: 빨간색 (`bg-red-600`)
    - 텍스트: 흰색
    - 호버: 더 진한 빨간색 (`bg-red-700`)
    - 클릭: 취소 확인 다이얼로그 표시
  - **비활성화** (취소 불가):
    - 배경: 회색 (`bg-gray-300`)
    - 텍스트: 진한 회색
    - 커서: `not-allowed`
    - 클릭: 무반응

#### 2.2.8. 취소 확인 다이얼로그
- **타입**: Modal Dialog
- **구성**:
  - 제목: "예약을 취소하시겠습니까?"
  - 예약 정보 요약 (콘서트명, 일시, 좌석)
  - 경고 메시지: "이 작업은 되돌릴 수 없습니다"
  - 액션 버튼:
    - **취소 버튼**: 다이얼로그 닫기
    - **확인 버튼**: 예약 취소 처리 실행

#### 2.2.9. 취소 불가 안내 메시지
- **표시 조건**: 
  - 공연 시작 2시간 이내
  - 이미 취소된 예약
  - 공연이 종료된 예약
- **UI**:
  - 경고 아이콘 (주황색)
  - 안내 메시지 텍스트
  - 고객센터 연락처 (취소 불가 시)

---

## 3. 사용자 행동 및 데이터 흐름

### 3.1. 예약 상세 페이지 진입

#### 사용자 행동
1. 예약 조회 페이지에서 특정 예약 카드 클릭
2. 또는 URL 직접 접근 (`/reservations/[reservationId]`)

#### 시스템 동작

**프론트엔드**
1. URL에서 `reservationId` 파라미터 추출
2. UUID 형식 유효성 검증
3. 로딩 상태 활성화 (스켈레톤 UI 표시)
4. 예약 상세 조회 API 호출

**API 요청**
```http
GET /api/reservations/:reservationId

Path Parameters:
- reservationId: UUID 형식의 예약 ID

예시:
GET /api/reservations/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

**백엔드**
1. `reservationId` 파라미터 추출 및 검증
2. UUID 형식 검증
3. 데이터베이스 쿼리 실행

**데이터베이스 쿼리**
```sql
-- 예약 상세 정보 조회 (모든 관련 데이터 JOIN)
SELECT 
  r.id,
  r.status,
  r.customer_name,
  r.customer_phone,
  r.customer_email,
  r.total_price,
  r.created_at,
  r.cancelled_at,
  r.seat_ids,
  -- 콘서트 정보
  c.id as concert_id,
  c.title as concert_title,
  c.poster_image_url,
  c.description as concert_description,
  -- 공연 일정 정보
  s.id as schedule_id,
  s.date_time as schedule_datetime,
  -- 좌석 정보 JSON 집계
  JSON_AGG(
    JSON_BUILD_OBJECT(
      'id', st.id,
      'seatNumber', st.seat_number,
      'grade', st.grade,
      'price', st.price,
      'status', st.status
    ) ORDER BY st.seat_number
  ) as seats
FROM reservations r
INNER JOIN schedules s ON r.schedule_id = s.id
INNER JOIN concerts c ON s.concert_id = c.id
LEFT JOIN seats st ON st.id = ANY(r.seat_ids)
WHERE r.id = $1
GROUP BY r.id, c.id, s.id;

-- 파라미터:
-- $1: reservationId (UUID)
```

**테이블 관계**
```
reservations (예약 기본 정보)
  ├─ schedule_id → schedules (공연 일정)
  │                  ├─ concert_id → concerts (콘서트 정보)
  │                  └─ date_time (공연 시간)
  └─ seat_ids[] → seats[] (좌석 정보 배열)
                    ├─ seat_number (좌석 번호)
                    ├─ grade (등급)
                    ├─ price (가격)
                    └─ status (상태)
```

#### 데이터 변화

**데이터베이스 접근**
- **테이블**: `reservations`, `concerts`, `schedules`, `seats`
- **작업**: READ (조회만, 데이터 변경 없음)
- **인덱스 활용**:
  - `reservations.id` (Primary Key)
  - `schedules.id` (Foreign Key Index)
  - `concerts.id` (Primary Key)

**API 응답**
```typescript
// 성공 응답 (200 OK)
{
  ok: true,
  data: {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    status: "confirmed",
    customerName: "홍길동",
    customerPhone: "010-1234-5678",
    customerEmail: "hong@example.com",
    totalPrice: 300000,
    createdAt: "2025-10-15T10:30:00+09:00",
    cancelledAt: null,
    concert: {
      id: "concert-uuid",
      title: "아이유 콘서트 2024",
      posterImageUrl: "https://picsum.photos/400/600",
      description: "아이유의 특별한 콘서트"
    },
    schedule: {
      id: "schedule-uuid",
      dateTime: "2025-12-25T19:00:00+09:00"
    },
    seats: [
      {
        id: "seat-uuid-1",
        seatNumber: "A01",
        grade: "R",
        price: 150000,
        status: "reserved"
      },
      {
        id: "seat-uuid-2",
        seatNumber: "A02",
        grade: "R",
        price: 150000,
        status: "reserved"
      }
    ],
    canCancel: true,  // 취소 가능 여부 (계산됨)
    cancelReason: null // 취소 불가 사유 (있을 경우)
  }
}

// 예약을 찾을 수 없음 (404 Not Found)
{
  ok: false,
  error: {
    code: "RESERVATION_NOT_FOUND",
    message: "예약을 찾을 수 없습니다"
  }
}

// 잘못된 UUID 형식 (400 Bad Request)
{
  ok: false,
  error: {
    code: "INVALID_RESERVATION_ID",
    message: "올바른 예약 번호 형식이 아닙니다"
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
{
  reservation: {...}, // API 응답 데이터
  isLoading: false,
  error: null,
  canCancel: true, // 취소 가능 여부
  showCancelDialog: false
}
```

---

### 3.2. 취소 가능 여부 판단

#### 시스템 동작

**백엔드에서 계산**
```typescript
// 취소 가능 여부 계산 로직
const checkCancellable = (reservation: Reservation): {
  canCancel: boolean;
  reason?: string;
} => {
  // 1. 이미 취소된 예약
  if (reservation.status === 'cancelled') {
    return {
      canCancel: false,
      reason: '이미 취소된 예약입니다'
    };
  }
  
  // 2. 공연 시작 시간 확인
  const scheduleDateTime = new Date(reservation.schedule.dateTime);
  const now = new Date();
  const hoursUntilShow = (scheduleDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  
  // 공연 시작 2시간 이내
  if (hoursUntilShow < 2) {
    return {
      canCancel: false,
      reason: '공연 시작 2시간 전까지만 취소 가능합니다'
    };
  }
  
  // 3. 이미 종료된 공연
  if (scheduleDateTime < now) {
    return {
      canCancel: false,
      reason: '종료된 공연입니다'
    };
  }
  
  // 취소 가능
  return { canCancel: true };
};
```

**데이터베이스 쿼리 (취소 가능 여부 계산 포함)**
```sql
-- 취소 가능 여부를 계산하여 반환
SELECT 
  r.*,
  s.date_time,
  CASE 
    WHEN r.status = 'cancelled' THEN false
    WHEN s.date_time < NOW() THEN false
    WHEN s.date_time - NOW() < INTERVAL '2 hours' THEN false
    ELSE true
  END as can_cancel,
  CASE
    WHEN r.status = 'cancelled' THEN '이미 취소된 예약입니다'
    WHEN s.date_time < NOW() THEN '종료된 공연입니다'
    WHEN s.date_time - NOW() < INTERVAL '2 hours' THEN '공연 시작 2시간 전까지만 취소 가능합니다'
    ELSE NULL
  END as cancel_reason
FROM reservations r
INNER JOIN schedules s ON r.schedule_id = s.id
WHERE r.id = $1;
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (조회 및 계산만)
- **클라이언트**: `canCancel`, `cancelReason` 상태 업데이트

---

### 3.3. 예약 취소 요청

#### 사용자 행동
1. '예약 취소하기' 버튼 클릭
2. 취소 확인 다이얼로그 표시
3. 다이얼로그에서 '확인' 버튼 클릭

#### 시스템 동작

**프론트엔드**
1. '예약 취소하기' 버튼 클릭 시 다이얼로그 표시
```typescript
const handleCancelButtonClick = () => {
  setShowCancelDialog(true);
};
```

2. 다이얼로그에서 '확인' 클릭 시 취소 API 호출
```typescript
const handleConfirmCancel = async () => {
  setIsProcessing(true);
  
  try {
    const response = await apiClient.delete(`/api/reservations/${reservationId}`);
    
    if (response.ok) {
      // 성공 처리
      setReservation(prev => ({
        ...prev,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      }));
      setCanCancel(false);
      showSuccessToast('예약이 성공적으로 취소되었습니다');
    }
  } catch (error) {
    showErrorToast('예약 취소 중 오류가 발생했습니다');
  } finally {
    setIsProcessing(false);
    setShowCancelDialog(false);
  }
};
```

3. 다이얼로그에서 '취소' 클릭 시
```typescript
const handleCancelDialog = () => {
  setShowCancelDialog(false);
  // 원래 상태 유지
};
```

**API 요청**
```http
DELETE /api/reservations/:reservationId
또는
PATCH /api/reservations/:reservationId
Content-Type: application/json

{
  "action": "cancel"
}

Path Parameters:
- reservationId: UUID 형식의 예약 ID

예시:
DELETE /api/reservations/a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

#### 데이터 변화
- **클라이언트**: 다이얼로그 표시 상태 변경
- **데이터베이스**: 아직 변화 없음 (확인 대기 중)

---

### 3.4. 예약 취소 처리 (트랜잭션)

#### 시스템 동작

**백엔드**
1. `reservationId` 파라미터 추출 및 검증
2. 취소 가능 여부 최종 검증
3. 트랜잭션 시작
4. 예약 상태 업데이트
5. 좌석 상태 복원
6. 트랜잭션 커밋

**데이터베이스 트랜잭션**
```sql
-- 트랜잭션 시작
BEGIN;

-- Step 1: 예약 정보 조회 및 락 획득
SELECT 
  r.id,
  r.status,
  r.seat_ids,
  s.date_time
FROM reservations r
INNER JOIN schedules s ON r.schedule_id = s.id
WHERE r.id = $1
  AND r.status = 'confirmed'  -- 확정 상태만
FOR UPDATE;  -- 비관적 락 (다른 트랜잭션 대기)

-- Step 2: 취소 가능 여부 재검증
-- (백엔드에서 수행, 조건 불충족 시 ROLLBACK)

-- Step 3: 예약 상태 업데이트
UPDATE reservations
SET 
  status = 'cancelled',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE id = $1
  AND status = 'confirmed'
RETURNING id, seat_ids;

-- Step 4: 좌석 상태 복원 (모든 좌석을 'available'로)
UPDATE seats
SET 
  status = 'available',
  updated_at = NOW()
WHERE id = ANY($2::UUID[])  -- $2 = seat_ids 배열
  AND status = 'reserved';

-- Step 5: 트랜잭션 커밋
COMMIT;

-- 오류 발생 시 자동 ROLLBACK
```

**트랜잭션 처리 로직 (백엔드)**
```typescript
// 예약 취소 서비스 함수
const cancelReservation = async (
  supabase: SupabaseClient,
  reservationId: string
): Promise<Result<Reservation>> => {
  try {
    // 트랜잭션 시작
    const { data: reservation, error: fetchError } = await supabase
      .from('reservations')
      .select(`
        *,
        schedule:schedules(date_time)
      `)
      .eq('id', reservationId)
      .eq('status', 'confirmed')
      .single();
    
    if (fetchError || !reservation) {
      return failure('RESERVATION_NOT_FOUND', '예약을 찾을 수 없습니다');
    }
    
    // 취소 가능 여부 검증
    const { canCancel, reason } = checkCancellable(reservation);
    if (!canCancel) {
      return failure('CANNOT_CANCEL', reason);
    }
    
    // 예약 상태 업데이트
    const { error: updateError } = await supabase
      .from('reservations')
      .update({
        status: 'cancelled',
        cancelled_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reservationId)
      .eq('status', 'confirmed');
    
    if (updateError) {
      throw updateError;
    }
    
    // 좌석 상태 복원
    const { error: seatsError } = await supabase
      .from('seats')
      .update({
        status: 'available',
        updated_at: new Date().toISOString()
      })
      .in('id', reservation.seat_ids);
    
    if (seatsError) {
      throw seatsError;
    }
    
    // 업데이트된 예약 정보 조회
    const { data: updatedReservation } = await supabase
      .from('reservations')
      .select('*')
      .eq('id', reservationId)
      .single();
    
    return success(updatedReservation);
    
  } catch (error) {
    logger.error('Reservation cancellation failed', { reservationId, error });
    return failure('INTERNAL_SERVER_ERROR', '예약 취소 처리 중 오류가 발생했습니다');
  }
};
```

#### 데이터 변화

**데이터베이스 변경**

**reservations 테이블**
```sql
-- BEFORE (취소 전)
id                                  | status    | cancelled_at | updated_at
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | confirmed | NULL         | 2025-10-15 10:30:00

-- AFTER (취소 후)
id                                  | status    | cancelled_at         | updated_at
a1b2c3d4-e5f6-7890-abcd-ef1234567890 | cancelled | 2025-10-15 14:20:00  | 2025-10-15 14:20:00
```

**seats 테이블**
```sql
-- BEFORE (취소 전)
id         | seat_number | status   | updated_at
seat-uuid-1 | A01         | reserved | 2025-10-15 10:30:00
seat-uuid-2 | A02         | reserved | 2025-10-15 10:30:00

-- AFTER (취소 후)
id         | seat_number | status    | updated_at
seat-uuid-1 | A01         | available | 2025-10-15 14:20:00
seat-uuid-2 | A02         | available | 2025-10-15 14:20:00
```

**API 응답**
```typescript
// 취소 성공 (200 OK)
{
  ok: true,
  data: {
    id: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    status: "cancelled",
    cancelledAt: "2025-10-15T14:20:00+09:00",
    // ... 기타 예약 정보
  }
}

// 이미 취소된 예약 (409 Conflict)
{
  ok: false,
  error: {
    code: "ALREADY_CANCELLED",
    message: "이미 취소된 예약입니다"
  }
}

// 취소 불가능 (400 Bad Request)
{
  ok: false,
  error: {
    code: "CANNOT_CANCEL",
    message: "공연 시작 2시간 전까지만 취소 가능합니다"
  }
}

// 예약을 찾을 수 없음 (404 Not Found)
{
  ok: false,
  error: {
    code: "RESERVATION_NOT_FOUND",
    message: "예약을 찾을 수 없습니다"
  }
}

// 서버 오류 (500 Internal Server Error)
{
  ok: false,
  error: {
    code: "INTERNAL_SERVER_ERROR",
    message: "예약 취소 처리 중 오류가 발생했습니다"
  }
}
```

**클라이언트 상태 업데이트**
```typescript
// 취소 성공 시
{
  reservation: {
    ...prev,
    status: 'cancelled',
    cancelledAt: '2025-10-15T14:20:00+09:00'
  },
  canCancel: false,
  showCancelDialog: false,
  successMessage: '예약이 성공적으로 취소되었습니다'
}

// 취소 실패 시
{
  reservation: {...}, // 원래 상태 유지
  canCancel: true,
  showCancelDialog: false,
  errorMessage: '예약 취소 중 오류가 발생했습니다'
}
```

---

### 3.5. 취소 완료 후 UI 업데이트

#### 시스템 동작

**프론트엔드**
1. API 응답 수신
2. 예약 상태를 로컬 상태로 업데이트
3. UI 요소 변경:
   - 예약 상태 배지: '확정' → '취소됨'
   - '예약 취소하기' 버튼: 비활성화
   - 취소 일시 표시
4. 성공 토스트 메시지 표시

**UI 업데이트**
```typescript
// 예약 상태 배지 업데이트
<Badge variant={status === 'confirmed' ? 'success' : 'default'}>
  {status === 'confirmed' ? '확정' : '취소됨'}
</Badge>

// 취소 버튼 비활성화
<Button 
  disabled={!canCancel || status === 'cancelled'}
  variant="destructive"
>
  예약 취소하기
</Button>

// 취소 일시 표시 (취소된 경우만)
{cancelledAt && (
  <div>
    <span>취소 일시:</span>
    <span>{formatDateTime(cancelledAt)}</span>
  </div>
)}

// 성공 토스트
<Toast>
  <CheckCircle />
  예약이 성공적으로 취소되었습니다
</Toast>
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (이미 업데이트 완료)
- **클라이언트**: UI 상태만 업데이트

---

### 3.6. 목록으로 돌아가기

#### 사용자 행동
1. '목록으로 돌아가기' 버튼 클릭
2. 또는 브라우저 뒤로가기

#### 시스템 동작
```typescript
const handleBackToList = () => {
  router.push('/reservations');
};
```

#### 데이터 변화
- **데이터베이스**: 변화 없음
- **클라이언트**: 라우팅 상태 변경

---

## 4. 오류 처리 및 엣지 케이스

### 4.1. 유효하지 않은 예약 ID

#### 케이스
- URL의 `reservationId`가 UUID 형식이 아님
- 또는 존재하지 않는 예약 ID

#### 처리

**클라이언트 측 검증**
```typescript
const isValidUUID = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

useEffect(() => {
  if (!isValidUUID(reservationId)) {
    router.push('/404');
    return;
  }
  
  // API 호출
}, [reservationId]);
```

**백엔드 응답**
```typescript
// 404 Not Found
{
  ok: false,
  error: {
    code: 'RESERVATION_NOT_FOUND',
    message: '예약을 찾을 수 없습니다'
  }
}
```

#### 데이터 변화
- **데이터베이스**: 쿼리 실행되나 결과 없음
- **클라이언트**: 404 페이지로 리다이렉트

---

### 4.2. 이미 취소된 예약

#### 케이스
- `status = 'cancelled'`인 예약에 접근
- 또는 취소 처리 중 다른 사용자가 먼저 취소함

#### 처리

**페이지 로드 시**
```typescript
// 취소된 상태로 표시
if (reservation.status === 'cancelled') {
  return (
    <div>
      <Badge variant="default">취소됨</Badge>
      <p>이미 취소된 예약입니다</p>
      <p>취소 일시: {formatDateTime(reservation.cancelledAt)}</p>
      <Button disabled>예약 취소하기</Button>
    </div>
  );
}
```

**취소 시도 시**
```typescript
// 409 Conflict 응답
{
  ok: false,
  error: {
    code: 'ALREADY_CANCELLED',
    message: '이미 취소된 예약입니다'
  }
}
```

#### 데이터 흐름
```
User → 취소 버튼 클릭 → API 호출 → DB 검증 (status = 'cancelled')
→ 409 응답 → 오류 메시지 표시 → 페이지 새로고침
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (이미 취소됨)
- **클라이언트**: 오류 메시지 + 페이지 새로고침으로 최신 상태 반영

---

### 4.3. 취소 불가능한 시간 (공연 임박)

#### 케이스
- 공연 시작까지 2시간 미만 남음
- `schedule.date_time - NOW() < INTERVAL '2 hours'`

#### 처리

**취소 가능 여부 판단**
```typescript
const hoursUntilShow = (scheduleDateTime.getTime() - Date.now()) / (1000 * 60 * 60);

if (hoursUntilShow < 2) {
  return {
    canCancel: false,
    reason: '공연 시작 2시간 전까지만 취소 가능합니다'
  };
}
```

**UI 표시**
```typescript
{!canCancel && (
  <Alert variant="warning">
    <AlertTriangle />
    <AlertTitle>취소 불가</AlertTitle>
    <AlertDescription>
      {cancelReason}
      <br />
      긴급 문의: 고객센터 1234-5678
    </AlertDescription>
  </Alert>
)}

<Button disabled={!canCancel}>
  예약 취소하기
</Button>
```

**취소 시도 시 백엔드 응답**
```typescript
// 400 Bad Request
{
  ok: false,
  error: {
    code: 'CANNOT_CANCEL',
    message: '공연 시작 2시간 전까지만 취소 가능합니다'
  }
}
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (취소 시도 차단)
- **클라이언트**: 경고 메시지 + 버튼 비활성화

---

### 4.4. 동시 취소 요청 충돌

#### 케이스
- 동일 예약에 대해 여러 브라우저/탭에서 동시 취소 시도
- 또는 네트워크 지연으로 중복 요청 발생

#### 처리

**데이터베이스 락 메커니즘**
```sql
-- FOR UPDATE로 비관적 락 획득
SELECT * FROM reservations
WHERE id = $1 AND status = 'confirmed'
FOR UPDATE;

-- 첫 번째 트랜잭션이 락을 획득하면 두 번째는 대기
-- 첫 번째가 COMMIT하면 두 번째는 status가 'cancelled'이므로 실패
```

**프론트엔드 중복 요청 방지**
```typescript
const [isProcessing, setIsProcessing] = useState(false);

const handleConfirmCancel = async () => {
  if (isProcessing) return; // 이미 처리 중이면 무시
  
  setIsProcessing(true);
  try {
    await cancelReservation(reservationId);
  } finally {
    setIsProcessing(false);
  }
};
```

**두 번째 요청 응답**
```typescript
// 409 Conflict
{
  ok: false,
  error: {
    code: 'ALREADY_CANCELLED',
    message: '이미 처리된 예약입니다'
  }
}
```

**UI 처리**
```typescript
// 오류 발생 시 페이지 자동 새로고침
if (error.code === 'ALREADY_CANCELLED') {
  showToast('이미 처리된 예약입니다. 페이지를 새로고침합니다.');
  setTimeout(() => {
    router.refresh(); // 또는 window.location.reload()
  }, 2000);
}
```

#### 데이터 흐름
```
Tab 1: 취소 요청 → DB 락 획득 → 상태 업데이트 → COMMIT
Tab 2: 취소 요청 → DB 락 대기 → 락 획득 → status 확인 (이미 cancelled) → 409 응답
```

#### 데이터 변화
- **데이터베이스**: 첫 번째 요청만 성공, 두 번째는 조건 불충족으로 실패
- **클라이언트 (Tab 1)**: 취소 완료 상태
- **클라이언트 (Tab 2)**: 오류 메시지 + 자동 새로고침

---

### 4.5. 네트워크 오류

#### 케이스
- API 요청 중 네트워크 연결 끊김
- 타임아웃 발생

#### 처리

**프론트엔드**
```typescript
const handleConfirmCancel = async () => {
  setIsProcessing(true);
  
  try {
    const response = await fetch(`/api/reservations/${reservationId}`, {
      method: 'DELETE',
      signal: AbortSignal.timeout(30000) // 30초 타임아웃
    });
    
    // ...
  } catch (error) {
    if (error.name === 'AbortError') {
      setError('요청 시간이 초과되었습니다. 다시 시도해주세요.');
    } else if (error.name === 'NetworkError') {
      setError('네트워크 연결을 확인해주세요.');
    } else {
      setError('예약 취소 중 오류가 발생했습니다.');
    }
    
    setShowRetryButton(true);
  } finally {
    setIsProcessing(false);
    setShowCancelDialog(false);
  }
};
```

**재시도 UI**
```typescript
{error && (
  <Alert variant="destructive">
    <AlertCircle />
    <AlertTitle>오류 발생</AlertTitle>
    <AlertDescription>{error}</AlertDescription>
    {showRetryButton && (
      <Button onClick={handleRetry} variant="outline">
        다시 시도
      </Button>
    )}
  </Alert>
)}
```

**상태 불명확 시 자동 재조회**
```typescript
// 네트워크 오류 후 예약 상태 재확인
const verifyReservationStatus = async () => {
  try {
    const response = await fetch(`/api/reservations/${reservationId}`);
    const data = await response.json();
    
    setReservation(data.data);
    
    // 실제로 취소되었으면 성공 메시지 표시
    if (data.data.status === 'cancelled') {
      showSuccessToast('예약이 취소되었습니다');
    }
  } catch (error) {
    // 재조회도 실패하면 재시도 옵션 제공
  }
};
```

#### 데이터 변화
- **데이터베이스**: 
  - 요청이 서버에 도달했으면 취소 완료
  - 요청이 도달하지 못했으면 변화 없음
- **클라이언트**: 오류 상태 + 재시도 옵션

---

### 4.6. 트랜잭션 실패 (부분 업데이트)

#### 케이스
- 예약 상태 업데이트는 성공했으나 좌석 복원 실패
- 데이터베이스 연결 끊김
- 디스크 공간 부족 등

#### 처리

**트랜잭션 롤백**
```sql
BEGIN;

-- Step 1: 예약 상태 업데이트
UPDATE reservations SET status = 'cancelled' WHERE id = $1;

-- Step 2: 좌석 상태 복원 (실패)
UPDATE seats SET status = 'available' WHERE id = ANY($2);
-- 오류 발생!

-- 자동 ROLLBACK → 모든 변경사항 취소
ROLLBACK;
```

**백엔드 오류 처리**
```typescript
try {
  await supabase.rpc('cancel_reservation_transaction', {
    reservation_id: reservationId
  });
} catch (error) {
  logger.error('Transaction failed', { reservationId, error });
  
  // 관리자 알림 (Slack, 이메일 등)
  await notifyAdmin({
    type: 'TRANSACTION_FAILURE',
    reservationId,
    error
  });
  
  return failure(
    'INTERNAL_SERVER_ERROR',
    '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요'
  );
}
```

**클라이언트 응답**
```typescript
// 500 Internal Server Error
{
  ok: false,
  error: {
    code: 'INTERNAL_SERVER_ERROR',
    message: '예약 취소에 실패했습니다. 잠시 후 다시 시도해주세요'
  }
}
```

**UI 표시**
```typescript
{error && (
  <Alert variant="destructive">
    <AlertCircle />
    <AlertTitle>취소 실패</AlertTitle>
    <AlertDescription>
      예약 취소 중 오류가 발생했습니다.
      <br />
      잠시 후 다시 시도하거나 고객센터(1234-5678)로 문의해주세요.
    </AlertDescription>
    <Button onClick={handleRetry}>다시 시도</Button>
  </Alert>
)}
```

#### 데이터 흐름
```
User → 취소 요청 → API 호출 → 트랜잭션 시작
→ 예약 업데이트 성공 → 좌석 업데이트 실패 → ROLLBACK
→ 500 응답 → 오류 메시지 → 재시도 옵션
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (ROLLBACK으로 원상복구)
- **클라이언트**: 오류 상태 + 재시도 옵션
- **로그**: 오류 로그 기록 + 관리자 알림

---

### 4.7. 이미 지난 공연의 예약

#### 케이스
- `schedule.date_time < NOW()`
- 공연이 이미 종료됨

#### 처리

**백엔드 검증**
```typescript
const scheduleDateTime = new Date(reservation.schedule.dateTime);
const now = new Date();

if (scheduleDateTime < now) {
  return {
    canCancel: false,
    reason: '종료된 공연입니다'
  };
}
```

**UI 표시**
```typescript
{!canCancel && cancelReason === '종료된 공연입니다' && (
  <Alert variant="default">
    <Info />
    <AlertTitle>종료된 공연</AlertTitle>
    <AlertDescription>
      이미 종료된 공연의 예약입니다.
      <br />
      취소는 불가능합니다.
    </AlertDescription>
  </Alert>
)}
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (취소 불가)
- **클라이언트**: 안내 메시지 + 버튼 비활성화

---

### 4.8. 데이터 로드 실패

#### 케이스
- 예약 상세 조회 API 호출 실패
- 데이터베이스 연결 오류

#### 처리

**프론트엔드**
```typescript
const { data: reservation, isLoading, error } = useQuery({
  queryKey: ['reservation', reservationId],
  queryFn: () => fetchReservation(reservationId),
  retry: 3,
  retryDelay: 1000
});

if (isLoading) {
  return <SkeletonUI />;
}

if (error) {
  return (
    <ErrorState>
      <AlertCircle size={48} />
      <h2>예약 정보를 불러올 수 없습니다</h2>
      <p>예약 정보를 불러오는 중 오류가 발생했습니다.</p>
      <div>
        <Button onClick={() => refetch()}>다시 시도</Button>
        <Button onClick={() => router.push('/reservations')} variant="outline">
          목록으로 돌아가기
        </Button>
      </div>
    </ErrorState>
  );
}
```

#### 데이터 변화
- **데이터베이스**: 변화 없음 (쿼리 실패)
- **클라이언트**: 오류 상태 + 복구 옵션

---

## 5. 성능 요구사항

### 5.1. 응답 시간
- **예약 상세 조회**: 500ms 이내
- **예약 취소 처리**: 1초 이내
- **트랜잭션 완료**: 2초 이내

### 5.2. 데이터베이스 최적화

#### 인덱스 활용
```sql
-- 이미 존재하는 인덱스
CREATE INDEX idx_reservations_schedule_id ON reservations(schedule_id);
CREATE INDEX idx_seats_schedule_id ON seats(schedule_id);
```

#### 쿼리 최적화
- JOIN은 필요한 테이블만 포함
- SELECT는 필요한 컬럼만 조회
- JSON_AGG로 좌석 정보 효율적 집계

### 5.3. 동시성 처리
- 트랜잭션 격리 수준: READ COMMITTED
- 비관적 락(FOR UPDATE)으로 동시 취소 방지
- 최대 100건/초의 취소 요청 처리 가능

---

## 6. 보안 요구사항

### 6.1. 권한 제어
- 현재: 예약 번호만으로 접근 가능
- 추후: 인증된 사용자만 자신의 예약 접근/취소 가능

### 6.2. 입력 검증
```typescript
// UUID 형식 검증
const validateReservationId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(id);
};

// SQL Injection 방지
const result = await db.query(
  'SELECT * FROM reservations WHERE id = $1',
  [reservationId] // 파라미터화된 쿼리
);
```

### 6.3. CSRF 방어
```typescript
// 취소 요청 시 CSRF 토큰 포함
const response = await fetch(`/api/reservations/${reservationId}`, {
  method: 'DELETE',
  headers: {
    'X-CSRF-Token': csrfToken
  }
});
```

### 6.4. Rate Limiting
- 동일 IP에서 분당 최대 10회 취소 요청 제한
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
- updated_at: TIMESTAMPTZ
```

#### schedules (공연 일정)
```sql
- id: UUID (Primary Key)
- concert_id: UUID (Foreign Key → concerts)
- date_time: TIMESTAMPTZ
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### concerts (콘서트)
```sql
- id: UUID (Primary Key)
- title: VARCHAR(255)
- description: TEXT, nullable
- poster_image_url: TEXT
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

#### seats (좌석)
```sql
- id: UUID (Primary Key)
- schedule_id: UUID (Foreign Key → schedules)
- seat_number: VARCHAR(10)
- grade: VARCHAR(5)
- price: INTEGER
- status: VARCHAR(20) ('available' | 'reserved')
- created_at: TIMESTAMPTZ
- updated_at: TIMESTAMPTZ
```

### 7.2. 데이터 관계도
```
reservations (예약 정보)
  ├─ schedule_id ──→ schedules (공연 일정)
  │                    ├─ concert_id ──→ concerts (콘서트)
  │                    │                   ├─ title
  │                    │                   └─ poster_image_url
  │                    └─ date_time (공연 시간)
  └─ seat_ids[] ──→ seats[] (좌석 정보)
                      ├─ seat_number
                      ├─ grade
                      ├─ price
                      └─ status (available ← cancelled 시 복원)
```

### 7.3. 상태 전이도
```
reservations.status:
  confirmed ─[취소 요청]→ cancelled (취소 가능 조건 충족 시)
  confirmed ─[취소 거부]→ confirmed (취소 불가 조건)
  cancelled ─[취소 시도]→ cancelled (변화 없음, 오류 반환)

seats.status (예약에 포함된 좌석):
  reserved ─[예약 취소]→ available (트랜잭션 내 자동 복원)
```

---

## 8. 구현 체크리스트

### 8.1. 프론트엔드
- [ ] 예약 상세 페이지 컴포넌트 생성 (`/reservations/[id]/page.tsx`)
- [ ] 예약 상세 조회 API 호출 훅 (React Query)
- [ ] 예약 정보 표시 UI (콘서트, 예약자, 좌석, 결제 정보)
- [ ] 예약 상태 배지 컴포넌트 (확정/취소됨)
- [ ] 취소 가능 여부 판단 로직
- [ ] 취소 확인 다이얼로그 컴포넌트 (shadcn/ui Dialog)
- [ ] 예약 취소 API 호출 훅
- [ ] 로딩 상태 UI (스켈레톤)
- [ ] 오류 상태 UI (재시도 버튼)
- [ ] 성공/오류 토스트 메시지
- [ ] 취소 불가 안내 메시지 (공연 임박, 이미 취소됨 등)
- [ ] '목록으로 돌아가기' 네비게이션

### 8.2. 백엔드
- [ ] 예약 상세 조회 API 엔드포인트 (`GET /api/reservations/:id`)
- [ ] 예약 취소 API 엔드포인트 (`DELETE /api/reservations/:id`)
- [ ] 예약 상세 조회 서비스 함수 (JOIN 쿼리)
- [ ] 예약 취소 서비스 함수 (트랜잭션 처리)
- [ ] 취소 가능 여부 검증 함수
- [ ] Zod 스키마 (요청/응답 검증)
- [ ] 오류 코드 정의 (`error.ts`)
- [ ] 오류 처리 및 로깅
- [ ] API 응답 포맷 표준화

### 8.3. 데이터베이스
- [ ] 예약 상세 조회 쿼리 작성 (JOIN + JSON_AGG)
- [ ] 예약 취소 트랜잭션 쿼리 작성
- [ ] 좌석 상태 복원 쿼리 작성
- [ ] 쿼리 성능 테스트
- [ ] 트랜잭션 롤백 테스트
- [ ] 동시성 테스트 (락 메커니즘)

### 8.4. 테스트
- [ ] 정상 조회 테스트
- [ ] 정상 취소 테스트
- [ ] 이미 취소된 예약 테스트
- [ ] 취소 불가능 시간 테스트 (공연 임박)
- [ ] 종료된 공연 테스트
- [ ] 동시 취소 요청 테스트
- [ ] 네트워크 오류 시나리오 테스트
- [ ] 트랜잭션 실패 시나리오 테스트
- [ ] 유효하지 않은 예약 ID 테스트
- [ ] 데이터 로드 실패 테스트
- [ ] 좌석 복원 검증 테스트

---

## 9. 향후 개선 사항

### 9.1. 기능 개선
- 환불 정책 통합 (취소 시점에 따른 환불 금액 계산)
- 취소 사유 수집 (선택형 입력)
- 이메일/SMS 취소 확인 알림
- 부분 취소 기능 (여러 좌석 중 일부만 취소)
- 취소 내역 조회 (사용자의 전체 취소 내역)

### 9.2. 성능 개선
- Redis 캐싱 (예약 상세 정보)
- 데이터베이스 쿼리 최적화
- CDN을 통한 포스터 이미지 최적화

### 9.3. UX 개선
- 취소 과정 진행 상태 표시 (프로그레스 바)
- 취소 후 유사 공연 추천
- 모바일 최적화 UI
- 오프라인 상태 감지 및 안내

### 9.4. 보안 개선
- 사용자 인증 통합 (본인 예약만 접근/취소)
- 예약 소유권 검증
- 2단계 인증 (중요 예약 취소 시)

---

## 10. 참고 자료
- PRD: `/docs/prd.md`
- 유저플로우: `/docs/userflow.md` - 유저플로우 #8
- 데이터베이스 설계: `/docs/database.md`
- 유스케이스 명세: `/docs/pages/008/spec.md`
- 예약 조회 요구사항: `/docs/pages/007/requirement.md`

