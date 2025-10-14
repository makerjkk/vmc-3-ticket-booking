# 유저플로우 003: 예약 페이지 - 회차 선택 구현 계획

## 개요

### 구현 목표
- 90초 목표 달성을 위한 핵심 단계로서 빠른 회차 선택 기능 구현
- Context + useReducer를 사용한 복잡한 상태 관리 (실시간 업데이트 포함)
- 회차별 잔여 좌석 수 실시간 동기화 및 좌석 배치도 연동
- 반응형 디자인과 접근성을 고려한 직관적인 UI/UX

### 모듈 목록

| 모듈명 | 위치 | 타입 | 설명 |
|--------|------|------|------|
| **ScheduleSelectionContext** | `src/features/booking/context/schedule-selection-context.tsx` | Context | 회차 선택 상태 관리 Context Provider |
| **ScheduleSelectionReducer** | `src/features/booking/hooks/use-schedule-selection-reducer.ts` | Hook | useReducer 기반 복잡한 상태 관리 로직 |
| **ScheduleService** | `src/features/booking/backend/service.ts` | Service | 회차 조회 및 좌석 데이터 비즈니스 로직 |
| **ScheduleRoute** | `src/features/booking/backend/route.ts` | Route | 회차 관련 Hono 라우터 정의 |
| **ScheduleSchema** | `src/features/booking/backend/schema.ts` | Schema | 회차 및 좌석 관련 Zod 스키마 정의 |
| **ScheduleError** | `src/features/booking/backend/error.ts` | Error | 회차 선택 관련 에러 코드 정의 |
| **ScheduleSelectionHook** | `src/features/booking/hooks/use-schedule-selection.ts` | Hook | React Query 기반 데이터 페칭 및 실시간 업데이트 |
| **BookingPage** | `src/app/booking/[concertId]/page.tsx` | Page | 예약 페이지 메인 컴포넌트 |
| **ScheduleList** | `src/features/booking/components/schedule-list.tsx` | Component | 회차 목록 컨테이너 컴포넌트 |
| **ScheduleCard** | `src/features/booking/components/schedule-card.tsx` | Component | 개별 회차 카드 컴포넌트 |
| **SeatLayout** | `src/features/booking/components/seat-layout.tsx` | Component | 좌석 배치도 컴포넌트 |
| **SeatGrid** | `src/features/booking/components/seat-grid.tsx` | Component | 좌석 그리드 렌더링 컴포넌트 |
| **BookingProgress** | `src/features/booking/components/booking-progress.tsx` | Component | 예매 진행 상태 표시 컴포넌트 |
| **ScheduleLoadingSkeleton** | `src/features/booking/components/schedule-loading-skeleton.tsx` | Component | 회차 로딩 상태 UI |
| **ScheduleErrorMessage** | `src/features/booking/components/schedule-error-message.tsx` | Component | 회차 관련 에러 상태 UI |
| **RealTimeUpdater** | `src/features/booking/components/real-time-updater.tsx` | Component | 실시간 좌석 수 업데이트 컴포넌트 |
| **SessionManager** | `src/features/booking/lib/session-manager.ts` | Utility | 세션 스토리지 관리 유틸리티 |
| **ScheduleDTO** | `src/features/booking/lib/dto.ts` | DTO | 클라이언트 측 타입 재노출 |
| **DateTimeUtils** | `src/features/booking/lib/datetime-utils.ts` | Utility | 날짜/시간 처리 유틸리티 |
| **PollingManager** | `src/features/booking/lib/polling-manager.ts` | Utility | 실시간 폴링 관리 유틸리티 |

---

## Diagram

```mermaid
graph TB
    %% Page Layer
    BP[BookingPage<br/>src/app/booking/[concertId]/page.tsx] --> SSP[ScheduleSelectionProvider<br/>Context Provider]
    
    %% Context Layer
    SSP --> SSR[ScheduleSelectionReducer<br/>Complex State Management]
    SSP --> SSH[ScheduleSelectionHook<br/>Data Fetching & Real-time]
    SSP --> SM[SessionManager<br/>Session Storage]
    
    %% Component Layer - Main
    SSP --> SL[ScheduleList<br/>Container Component]
    SSP --> SeatL[SeatLayout<br/>Seat Display]
    SSP --> BP_Progress[BookingProgress<br/>Progress Indicator]
    
    %% Component Layer - Schedule
    SL --> SC[ScheduleCard<br/>Individual Schedule]
    SL --> SLS[ScheduleLoadingSkeleton<br/>Loading UI]
    SL --> SEM[ScheduleErrorMessage<br/>Error UI]
    
    %% Component Layer - Seat
    SeatL --> SG[SeatGrid<br/>Seat Grid Renderer]
    SeatL --> RTU[RealTimeUpdater<br/>Real-time Updates]
    
    %% Hook Layer
    SSH --> AC[ApiClient<br/>HTTP Client]
    SSH --> RQ[React Query<br/>Cache & State]
    SSH --> PM[PollingManager<br/>Polling Logic]
    
    %% Backend Layer
    AC --> SRoute[ScheduleRoute<br/>Hono Router]
    SRoute --> SS[ScheduleService<br/>Business Logic]
    SRoute --> SSSC[ScheduleSchema<br/>Validation]
    SRoute --> SE[ScheduleError<br/>Error Handling]
    
    %% Database Layer
    SS --> DB[(Supabase<br/>schedules + seats)]
    
    %% Utility Layer
    SSP --> DTU[DateTimeUtils<br/>Date/Time Processing]
    SM --> SessionS[SessionStorage<br/>Browser Storage]
    RTU --> WS[WebSocket<br/>Real-time Connection]
    
    %% Shared Components
    SC --> UI[shadcn/ui<br/>Base Components]
    SLS --> UI
    SEM --> UI
    SG --> UI
    BP_Progress --> UI
    
    %% DTO Layer
    SSSC --> DTO[ScheduleDTO<br/>Type Definitions]
    SSH --> DTO
    
    %% Data Flow Directions
    SC -.->|selectSchedule| SSP
    SG -.->|seatClick| SSP
    RTU -.->|updateSeats| SSP
    AC -.->|API Response| SSH
    WS -.->|Real-time Data| RTU
    
    style BP fill:#e3f2fd
    style SSP fill:#f3e5f5
    style SSH fill:#e8f5e8
    style SS fill:#fff3e0
    style DB fill:#ffebee
    style UI fill:#f1f8e9
    style WS fill:#fce4ec
```

---

## Implementation Plan

### 1. Backend Layer (우선순위: 높음)

#### 1.1 ScheduleSchema (`src/features/booking/backend/schema.ts`)
**목적**: 회차 및 좌석 관련 API 스키마 정의
```typescript
// 주요 스키마
- ScheduleListRequestSchema: 회차 목록 조회 요청 (concertId, date)
- ScheduleListResponseSchema: 회차 목록 응답 (시간, 잔여좌석 포함)
- ScheduleDetailRequestSchema: 특정 회차 상세 조회 요청
- SeatLayoutResponseSchema: 좌석 배치도 응답
- SeatCountUpdateSchema: 실시간 좌석 수 업데이트 응답
```

**Unit Test 시나리오**:
- 유효한 concertId와 date로 요청 스키마 검증
- 잘못된 UUID 형식 concertId 검증 실패
- 과거 날짜 요청 시 검증 실패
- 회차 응답 데이터 스키마 검증 (필수 필드 포함)
- 좌석 데이터 스키마 검증 (status, grade, price 필드)

#### 1.2 ScheduleError (`src/features/booking/backend/error.ts`)
**목적**: 회차 선택 관련 에러 코드 체계 정의
```typescript
// 에러 코드 정의
- SCHEDULE_NOT_FOUND: 회차를 찾을 수 없음
- SCHEDULE_SOLD_OUT: 회차 매진
- SEAT_DATA_LOAD_FAILED: 좌석 데이터 로드 실패
- INVALID_DATE_RANGE: 유효하지 않은 날짜 범위
- REAL_TIME_UPDATE_FAILED: 실시간 업데이트 실패
```

#### 1.3 ScheduleService (`src/features/booking/backend/service.ts`)
**목적**: 회차 조회 및 좌석 데이터 비즈니스 로직
```typescript
// 주요 함수
- getSchedulesByDate(): 특정 날짜의 회차 목록 조회
- getScheduleDetail(): 특정 회차 상세 정보 조회
- getSeatLayout(): 좌석 배치도 데이터 조회
- getSeatCount(): 실시간 좌석 수 조회
- validateScheduleAvailability(): 회차 예매 가능 여부 검증
```

**Unit Test 시나리오**:
- 유효한 날짜로 회차 목록 조회 성공
- 존재하지 않는 콘서트 ID로 조회 시 빈 배열 반환
- 과거 날짜 회차 필터링 확인
- 매진된 회차 상태 정확히 계산
- 좌석 배치도 데이터 구조 검증
- 실시간 좌석 수 계산 정확성 검증

#### 1.4 ScheduleRoute (`src/features/booking/backend/route.ts`)
**목적**: 회차 관련 API 엔드포인트 정의
```typescript
// API 엔드포인트
- GET /api/concerts/{concertId}/schedules?date={date}: 회차 목록 조회
- GET /api/schedules/{scheduleId}: 회차 상세 조회
- GET /api/schedules/{scheduleId}/seats: 좌석 배치도 조회
- GET /api/schedules/{scheduleId}/seats/count: 실시간 좌석 수 조회
```

### 2. Context & State Management Layer (우선순위: 높음)

#### 2.1 ScheduleSelectionReducer (`src/features/booking/hooks/use-schedule-selection-reducer.ts`)
**목적**: 복잡한 회차 선택 상태 관리 로직
```typescript
// 상태 구조
interface ScheduleSelectionState {
  // 기본 상태
  selectedDate: string | null;
  selectedScheduleId: string | null;
  schedules: Schedule[] | null;
  seats: SeatData[] | null;
  
  // 로딩 상태
  isSchedulesLoading: boolean;
  isSeatsLoading: boolean;
  
  // 에러 상태
  schedulesError: Error | null;
  seatsError: Error | null;
  
  // 실시간 업데이트
  pollingInterval: NodeJS.Timeout | null;
  lastUpdated: Date | null;
  isPollingActive: boolean;
  
  // UI 상태
  tooltipState: TooltipState | null;
  selectedSeats: string[];
  totalPrice: number;
}

// 액션 타입
- SELECT_DATE: 날짜 선택
- SELECT_SCHEDULE: 회차 선택
- LOAD_SCHEDULES_START/SUCCESS/FAILURE: 회차 로딩 상태
- LOAD_SEATS_START/SUCCESS/FAILURE: 좌석 로딩 상태
- UPDATE_SEAT_COUNT: 실시간 좌석 수 업데이트
- START_POLLING/STOP_POLLING: 폴링 제어
- SHOW_TOOLTIP/HIDE_TOOLTIP: 툴팁 제어
- SELECT_SEAT/DESELECT_SEAT: 좌석 선택/해제
- RESET_STATE: 상태 초기화
```

**Unit Test 시나리오**:
- 날짜 선택 시 회차 목록 초기화 확인
- 회차 선택 시 좌석 데이터 로딩 상태 변경 확인
- 실시간 업데이트 시 좌석 수 정확히 반영
- 에러 발생 시 적절한 에러 상태 설정
- 폴링 시작/중지 시 상태 변경 확인
- 좌석 선택 시 총 가격 계산 정확성

#### 2.2 ScheduleSelectionContext (`src/features/booking/context/schedule-selection-context.tsx`)
**목적**: 회차 선택 상태를 하위 컴포넌트에 제공
```typescript
// Context 인터페이스
interface ScheduleSelectionContextValue {
  // 상태
  state: ScheduleSelectionState;
  
  // 액션 함수
  selectDate: (date: string) => void;
  selectSchedule: (scheduleId: string) => void;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  
  // 유틸리티 함수
  isScheduleAvailable: (scheduleId: string) => boolean;
  isSeatAvailable: (seatId: string) => boolean;
  getScheduleById: (scheduleId: string) => Schedule | null;
  getSeatById: (seatId: string) => SeatData | null;
  
  // 계산된 값
  availableSchedules: Schedule[];
  selectedScheduleInfo: Schedule | null;
  availableSeatsCount: number;
  selectedSeatsInfo: SeatData[];
}
```

### 3. Data Fetching Layer (우선순위: 높음)

#### 3.1 ScheduleSelectionHook (`src/features/booking/hooks/use-schedule-selection.ts`)
**목적**: React Query 기반 데이터 페칭 및 실시간 업데이트
```typescript
// 주요 훅
- useSchedulesByDate(): 날짜별 회차 목록 조회
- useScheduleDetail(): 특정 회차 상세 조회
- useSeatLayout(): 좌석 배치도 조회
- useRealTimeSeatCount(): 실시간 좌석 수 업데이트
- useSchedulePolling(): 폴링 기반 실시간 업데이트
```

**Unit Test 시나리오**:
- 유효한 날짜로 회차 목록 조회 성공
- 네트워크 오류 시 재시도 로직 동작 확인
- 캐시된 데이터 사용 확인
- 실시간 업데이트 시 UI 반영 확인
- 폴링 간격 설정 및 정지 확인

### 4. Component Layer (우선순위: 중간)

#### 4.1 BookingPage (`src/app/booking/[concertId]/page.tsx`)
**목적**: 예약 페이지 메인 컴포넌트
```typescript
// 주요 기능
- URL 파라미터에서 concertId 추출
- ScheduleSelectionProvider로 상태 관리 제공
- 전체 예약 플로우 레이아웃 구성
- 에러 바운더리 적용
```

**QA Sheet**:
- [ ] 유효한 concertId로 페이지 접근 시 정상 렌더링
- [ ] 유효하지 않은 concertId로 접근 시 404 에러 표시
- [ ] 페이지 새로고침 시 선택 상태 복원
- [ ] 브라우저 뒤로가기 시 적절한 상태 유지
- [ ] 모바일/데스크톱 반응형 레이아웃 확인

#### 4.2 ScheduleList (`src/features/booking/components/schedule-list.tsx`)
**목적**: 회차 목록 컨테이너 컴포넌트
```typescript
// 주요 기능
- 회차 목록 렌더링 (시간순 정렬)
- 로딩/에러 상태 처리
- 매진/예매가능 상태별 시각적 구분
- 반응형 그리드 레이아웃
```

**QA Sheet**:
- [ ] 회차 목록이 시간순으로 정렬되어 표시
- [ ] 매진된 회차가 비활성화 상태로 표시
- [ ] 로딩 중 스켈레톤 UI 표시
- [ ] 에러 발생 시 재시도 버튼 표시
- [ ] 모바일에서 세로 스택, 데스크톱에서 그리드 레이아웃

#### 4.3 ScheduleCard (`src/features/booking/components/schedule-card.tsx`)
**목적**: 개별 회차 카드 컴포넌트
```typescript
// 주요 기능
- 회차 시간 표시 (HH:MM 형식)
- 잔여 좌석 수 표시
- 상태별 시각적 스타일링 (예매가능/매진/임박)
- 클릭 이벤트 처리
- 접근성 지원 (ARIA 라벨)
```

**QA Sheet**:
- [ ] 회차 시간이 올바른 형식으로 표시
- [ ] 잔여 좌석 수가 정확히 표시
- [ ] 매진 상태일 때 클릭 불가 처리
- [ ] 선택된 회차 하이라이트 표시
- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환성

#### 4.4 SeatLayout (`src/features/booking/components/seat-layout.tsx`)
**목적**: 좌석 배치도 메인 컴포넌트
```typescript
// 주요 기능
- 좌석 배치도 전체 레이아웃 관리
- 무대 위치 표시
- 등급별 좌석 구역 구분
- 범례 표시 (선택가능/선택됨/매진)
- 확대/축소 기능 (선택사항)
```

**QA Sheet**:
- [ ] 무대 위치가 명확히 표시
- [ ] 등급별 좌석 구역이 구분되어 표시
- [ ] 좌석 상태 범례가 정확히 표시
- [ ] 모바일에서 터치 스크롤 지원
- [ ] 좌석 선택 시 즉시 시각적 피드백

#### 4.5 SeatGrid (`src/features/booking/components/seat-grid.tsx`)
**목적**: 좌석 그리드 렌더링 컴포넌트
```typescript
// 주요 기능
- SVG 기반 좌석 렌더링
- 좌석별 상태 시각화 (색상 구분)
- 좌석 클릭 이벤트 처리
- 좌석 번호 표시
- 가격 정보 툴팁
```

**QA Sheet**:
- [ ] 좌석이 올바른 위치에 렌더링
- [ ] 좌석 상태별 색상 구분 정확
- [ ] 좌석 클릭 시 선택/해제 동작
- [ ] 좌석 번호가 명확히 표시
- [ ] 매진 좌석 클릭 시 툴팁 표시

### 5. Utility Layer (우선순위: 중간)

#### 5.1 SessionManager (`src/features/booking/lib/session-manager.ts`)
**목적**: 세션 스토리지 관리 유틸리티
```typescript
// 주요 기능
- 선택 상태 세션 저장/복원
- 만료 시간 관리 (30분)
- 데이터 직렬화/역직렬화
- 타입 안전성 보장
```

**Unit Test 시나리오**:
- 선택 상태 저장 후 정확한 복원
- 만료된 세션 데이터 자동 삭제
- 잘못된 데이터 형식 처리
- 브라우저 지원 여부 확인

#### 5.2 PollingManager (`src/features/booking/lib/polling-manager.ts`)
**목적**: 실시간 폴링 관리 유틸리티
```typescript
// 주요 기능
- 폴링 간격 관리 (5초)
- 백그라운드 탭에서 폴링 중지
- 네트워크 오류 시 지수 백오프
- 메모리 누수 방지
```

**Unit Test 시나리오**:
- 폴링 시작/중지 정확한 동작
- 백그라운드 탭에서 폴링 중지 확인
- 네트워크 오류 시 재시도 로직
- 컴포넌트 언마운트 시 정리 확인

#### 5.3 DateTimeUtils (`src/features/booking/lib/datetime-utils.ts`)
**목적**: 날짜/시간 처리 유틸리티
```typescript
// 주요 기능
- 회차 시간 포맷팅 (HH:MM)
- 날짜 비교 및 검증
- 타임존 처리 (KST)
- 상대 시간 표시
```

**Unit Test 시나리오**:
- 다양한 시간 형식 포맷팅 확인
- 과거/미래 날짜 검증 정확성
- 타임존 변환 정확성
- 경계값 처리 (자정, 연말 등)

### 6. Real-time Update Layer (우선순위: 중간)

#### 6.1 RealTimeUpdater (`src/features/booking/components/real-time-updater.tsx`)
**목적**: 실시간 좌석 수 업데이트 컴포넌트
```typescript
// 주요 기능
- 5초 간격 폴링 실행
- 좌석 수 변화 감지 및 UI 업데이트
- WebSocket 연결 관리 (선택사항)
- 업데이트 애니메이션 효과
```

**QA Sheet**:
- [ ] 5초 간격으로 정확한 폴링 실행
- [ ] 좌석 수 변화 시 부드러운 애니메이션
- [ ] 매진 전환 시 즉시 UI 업데이트
- [ ] 네트워크 오류 시 재시도 동작
- [ ] 컴포넌트 언마운트 시 폴링 정지

### 7. Error Handling & Loading Layer (우선순위: 낮음)

#### 7.1 ScheduleLoadingSkeleton (`src/features/booking/components/schedule-loading-skeleton.tsx`)
**목적**: 회차 로딩 상태 UI
```typescript
// 주요 기능
- 회차 카드 스켈레톤 UI
- 애니메이션 효과 (shimmer)
- 반응형 레이아웃 대응
```

**QA Sheet**:
- [ ] 실제 회차 카드와 유사한 크기/모양
- [ ] 부드러운 로딩 애니메이션
- [ ] 모바일/데스크톱 반응형 대응

#### 7.2 ScheduleErrorMessage (`src/features/booking/components/schedule-error-message.tsx`)
**목적**: 회차 관련 에러 상태 UI
```typescript
// 주요 기능
- 에러 타입별 메시지 표시
- 재시도 버튼 제공
- 고객센터 연락처 안내
- 접근성 지원
```

**QA Sheet**:
- [ ] 에러 타입별 적절한 메시지 표시
- [ ] 재시도 버튼 클릭 시 정상 동작
- [ ] 고객센터 연락처 정확한 표시
- [ ] 스크린 리더 호환성

---

## 구현 우선순위

### Phase 1: 핵심 백엔드 및 상태 관리 (1-2일)
1. ScheduleSchema, ScheduleError 정의
2. ScheduleService 비즈니스 로직 구현
3. ScheduleRoute API 엔드포인트 구현
4. ScheduleSelectionReducer 상태 관리 로직
5. ScheduleSelectionContext Provider 구현

### Phase 2: 데이터 페칭 및 메인 컴포넌트 (1-2일)
1. ScheduleSelectionHook React Query 연동
2. BookingPage 메인 페이지 구현
3. ScheduleList 컨테이너 컴포넌트
4. ScheduleCard 개별 카드 컴포넌트
5. 기본적인 좌석 배치도 (SeatLayout, SeatGrid)

### Phase 3: 실시간 업데이트 및 유틸리티 (1일)
1. RealTimeUpdater 폴링 기반 업데이트
2. PollingManager 폴링 관리 유틸리티
3. SessionManager 세션 관리
4. DateTimeUtils 날짜/시간 처리

### Phase 4: UI/UX 개선 및 에러 처리 (1일)
1. ScheduleLoadingSkeleton 로딩 UI
2. ScheduleErrorMessage 에러 UI
3. BookingProgress 진행 상태 표시
4. 접근성 및 반응형 디자인 개선

### Phase 5: 테스트 및 최적화 (1일)
1. Unit Test 작성 및 실행
2. QA Sheet 기반 기능 테스트
3. 성능 최적화 (메모이제이션, 지연 로딩)
4. 실시간 업데이트 성능 튜닝

---

## 성공 기준

### 기능적 요구사항
- [ ] 날짜 선택 후 1초 이내 회차 목록 표시
- [ ] 회차 선택 후 2초 이내 좌석 배치도 표시
- [ ] 실시간 좌석 수 업데이트 (5초 주기)
- [ ] 매진 회차 선택 시 적절한 안내 메시지
- [ ] 세션 관리로 페이지 새로고침 시 상태 유지

### 비기능적 요구사항
- [ ] 모바일/데스크톱 반응형 디자인
- [ ] 키보드 네비게이션 지원
- [ ] 스크린 리더 호환성 (WCAG 2.1 AA)
- [ ] 네트워크 오류 시 적절한 에러 처리
- [ ] 메모리 누수 없는 폴링 관리

### 성능 요구사항
- [ ] 회차 목록 로딩 시간 1초 이내
- [ ] 좌석 배치도 렌더링 2초 이내
- [ ] 실시간 업데이트 지연시간 1초 이내
- [ ] 동시 사용자 100명 기준 안정적 동작

이 구현 계획은 90초 내 예매 완료 목표를 달성하기 위한 핵심 단계인 회차 선택 기능을 체계적으로 구현하며, 실시간 업데이트와 사용자 경험을 모두 고려한 설계입니다.
