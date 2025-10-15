# Flux 패턴 설계: 예약 조회 페이지

## 문서 정보
- **기능 ID**: FLUX-007
- **기능 명**: 예약 조회 Flux 아키텍처
- **관련 문서**: 
  - 상태 정의: `/docs/pages/007/state-definition.md`
  - 요구사항: `/docs/pages/007/requirement.md`
- **작성일**: 2025-10-15
- **버전**: 1.0

---

## 1. Flux 패턴 개요

### 1.1. 기본 구조

```
┌──────────┐      ┌──────────┐      ┌───────┐      ┌──────┐
│  Action  │ ───▶ │ Reducer  │ ───▶ │ Store │ ───▶ │ View │
└──────────┘      └──────────┘      └───────┘      └──────┘
     ▲                                                  │
     └──────────────────────────────────────────────────┘
                     (User Interaction)
```

### 1.2. 예약 조회 페이지에서의 적용

- **Action**: 사용자 상호작용 (입력, 버튼 클릭) 및 API 응답
- **Reducer**: 액션 타입에 따른 상태 변경 로직
- **Store**: useReducer로 관리되는 중앙 상태
- **View**: React 컴포넌트 (상태를 구독하고 렌더링)

---

## 2. Action 정의

### 2.1. Action Types

```typescript
// Action 타입 상수 정의
const ActionTypes = {
  // 검색 폼 액션
  SET_RESERVATION_ID: 'SET_RESERVATION_ID',
  SET_CONTACT: 'SET_CONTACT',
  SET_VALIDATION_ERROR: 'SET_VALIDATION_ERROR',
  CLEAR_VALIDATION_ERRORS: 'CLEAR_VALIDATION_ERRORS',
  RESET_FORM: 'RESET_FORM',
  
  // 검색 액션
  SEARCH_START: 'SEARCH_START',
  SEARCH_SUCCESS: 'SEARCH_SUCCESS',
  SEARCH_FAILURE: 'SEARCH_FAILURE',
  
  // 페이지네이션 액션
  SET_CURRENT_PAGE: 'SET_CURRENT_PAGE',
  
  // 전역 액션
  RESET_STATE: 'RESET_STATE',
} as const;
```

---

### 2.2. Action Creators

```typescript
// Action 생성자 함수들

// 검색 폼 액션
export const setReservationId = (value: string) => ({
  type: ActionTypes.SET_RESERVATION_ID,
  payload: value,
});

export const setContact = (value: string) => ({
  type: ActionTypes.SET_CONTACT,
  payload: value,
});

export const setValidationError = (
  field: 'reservationId' | 'contact',
  error: string | null
) => ({
  type: ActionTypes.SET_VALIDATION_ERROR,
  payload: { field, error },
});

export const clearValidationErrors = () => ({
  type: ActionTypes.CLEAR_VALIDATION_ERRORS,
});

export const resetForm = () => ({
  type: ActionTypes.RESET_FORM,
});

// 검색 액션
export const searchStart = () => ({
  type: ActionTypes.SEARCH_START,
});

export const searchSuccess = (results: Reservation[]) => ({
  type: ActionTypes.SEARCH_SUCCESS,
  payload: results,
});

export const searchFailure = (error: string) => ({
  type: ActionTypes.SEARCH_FAILURE,
  payload: error,
});

// 페이지네이션 액션
export const setCurrentPage = (page: number) => ({
  type: ActionTypes.SET_CURRENT_PAGE,
  payload: page,
});

// 전역 액션
export const resetState = () => ({
  type: ActionTypes.RESET_STATE,
});
```

---

### 2.3. Action 타입 정의

```typescript
// Action 유니온 타입
type ReservationSearchAction =
  | { type: 'SET_RESERVATION_ID'; payload: string }
  | { type: 'SET_CONTACT'; payload: string }
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: 'reservationId' | 'contact'; error: string | null } }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'RESET_FORM' }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: Reservation[] }
  | { type: 'SEARCH_FAILURE'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'RESET_STATE' };
```

---

## 3. State 정의

### 3.1. State 타입

```typescript
// 예약 타입
type Reservation = {
  id: string;
  concertTitle: string;
  scheduleDateTime: string;
  customerName: string;
  totalPrice: number;
  status: 'confirmed' | 'cancelled';
  seats: Array<{
    seatNumber: string;
    grade: string;
    price: number;
  }>;
  createdAt: string;
  cancelledAt: string | null;
};

// 전체 상태 타입
type ReservationSearchState = {
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

### 3.2. Initial State

```typescript
// 초기 상태
const initialState: ReservationSearchState = {
  searchForm: {
    reservationId: '',
    contact: '',
  },
  validationErrors: {
    reservationId: null,
    contact: null,
  },
  searchResults: [],
  isLoading: false,
  error: null,
  currentPage: 1,
};
```

---

## 4. Reducer 정의

### 4.1. Reducer 함수

```typescript
// Reducer 함수 (상태 변경 로직)
function reservationSearchReducer(
  state: ReservationSearchState,
  action: ReservationSearchAction
): ReservationSearchState {
  switch (action.type) {
    // 검색 폼 액션 처리
    case 'SET_RESERVATION_ID':
      return {
        ...state,
        searchForm: {
          ...state.searchForm,
          reservationId: action.payload,
        },
      };
    
    case 'SET_CONTACT':
      return {
        ...state,
        searchForm: {
          ...state.searchForm,
          contact: action.payload,
        },
      };
    
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.field]: action.payload.error,
        },
      };
    
    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: {
          reservationId: null,
          contact: null,
        },
      };
    
    case 'RESET_FORM':
      return {
        ...state,
        searchForm: {
          reservationId: '',
          contact: '',
        },
        validationErrors: {
          reservationId: null,
          contact: null,
        },
      };
    
    // 검색 액션 처리
    case 'SEARCH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        currentPage: 1, // 새 검색 시 페이지 리셋
      };
    
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        searchResults: action.payload,
        error: null,
      };
    
    case 'SEARCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    // 페이지네이션 액션 처리
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };
    
    // 전역 액션 처리
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}
```

---

## 5. Flux 패턴 시각화 (Mermaid)

### 5.1. 전체 흐름도

```mermaid
graph TB
    subgraph User["👤 User"]
        U1[입력 필드에 텍스트 입력]
        U2[조회 버튼 클릭]
        U3[페이지 번호 클릭]
    end
    
    subgraph Actions["📤 Actions"]
        A1[SET_RESERVATION_ID]
        A2[SET_CONTACT]
        A3[SET_VALIDATION_ERROR]
        A4[SEARCH_START]
        A5[SEARCH_SUCCESS]
        A6[SEARCH_FAILURE]
        A7[SET_CURRENT_PAGE]
    end
    
    subgraph Reducer["⚙️ Reducer"]
        R1[reservationSearchReducer]
    end
    
    subgraph Store["🗄️ Store"]
        S1[searchForm]
        S2[validationErrors]
        S3[searchResults]
        S4[isLoading]
        S5[error]
        S6[currentPage]
    end
    
    subgraph View["🖼️ View Components"]
        V1[검색 폼]
        V2[검색 결과 목록]
        V3[페이지네이션]
        V4[로딩 인디케이터]
        V5[오류 메시지]
    end
    
    U1 -->|dispatch| A1
    U1 -->|dispatch| A2
    U2 -->|dispatch| A4
    U3 -->|dispatch| A7
    
    A1 --> R1
    A2 --> R1
    A3 --> R1
    A4 --> R1
    A5 --> R1
    A6 --> R1
    A7 --> R1
    
    R1 -->|update| S1
    R1 -->|update| S2
    R1 -->|update| S3
    R1 -->|update| S4
    R1 -->|update| S5
    R1 -->|update| S6
    
    S1 -->|render| V1
    S2 -->|render| V1
    S3 -->|render| V2
    S4 -->|render| V4
    S5 -->|render| V5
    S6 -->|render| V3
    
    V1 -.->|user interaction| U1
    V1 -.->|user interaction| U2
    V3 -.->|user interaction| U3
```

---

### 5.2. 검색 폼 입력 흐름

```mermaid
sequenceDiagram
    participant User
    participant View as 검색 폼 View
    participant Action as Action Creator
    participant Reducer
    participant Store
    participant ReRender as Re-render

    User->>View: 예약 번호 입력 "abc-123"
    View->>Action: setReservationId("abc-123")
    Action->>Reducer: {type: SET_RESERVATION_ID, payload: "abc-123"}
    Reducer->>Store: state.searchForm.reservationId = "abc-123"
    Store->>ReRender: 상태 변경 알림
    ReRender->>View: 입력 필드 업데이트
    
    View->>Action: validateReservationId("abc-123")
    Action->>Reducer: {type: SET_VALIDATION_ERROR, payload: {...}}
    Reducer->>Store: state.validationErrors.reservationId = "오류 메시지" or null
    Store->>ReRender: 상태 변경 알림
    ReRender->>View: 검증 오류 메시지 표시/숨김
```

---

### 5.3. 검색 실행 흐름

```mermaid
sequenceDiagram
    participant User
    participant View as 검색 폼 View
    participant Action as Action Creator
    participant Reducer
    participant Store
    participant API
    participant ResultView as 검색 결과 View

    User->>View: "조회하기" 버튼 클릭
    View->>Action: searchStart()
    Action->>Reducer: {type: SEARCH_START}
    Reducer->>Store: isLoading = true, currentPage = 1
    Store->>View: 로딩 상태 렌더링 (스피너 표시)
    
    View->>API: fetch("/api/reservations/search?...")
    
    alt API 성공
        API-->>View: {ok: true, data: [...]}
        View->>Action: searchSuccess([...])
        Action->>Reducer: {type: SEARCH_SUCCESS, payload: [...]}
        Reducer->>Store: isLoading = false, searchResults = [...]
        Store->>ResultView: 검색 결과 렌더링
    else API 실패
        API-->>View: {ok: false, error: "..."}
        View->>Action: searchFailure("오류 메시지")
        Action->>Reducer: {type: SEARCH_FAILURE, payload: "..."}
        Reducer->>Store: isLoading = false, error = "..."
        Store->>ResultView: 오류 메시지 렌더링
    end
```

---

### 5.4. 페이지네이션 흐름

```mermaid
sequenceDiagram
    participant User
    participant View as 페이지네이션 View
    participant Action as Action Creator
    participant Reducer
    participant Store
    participant ResultView as 검색 결과 View

    User->>View: 페이지 "2" 클릭
    View->>Action: setCurrentPage(2)
    Action->>Reducer: {type: SET_CURRENT_PAGE, payload: 2}
    Reducer->>Store: currentPage = 2
    Store->>ResultView: 2페이지 결과 렌더링 (items 10-20)
    Store->>View: 페이지네이션 UI 업데이트 (2번 활성화)
```

---

### 5.5. 상태별 Flux 흐름 다이어그램

#### 5.5.1. searchForm 상태 흐름

```mermaid
graph LR
    A1[User Input] -->|예약번호 입력| B1[SET_RESERVATION_ID Action]
    A2[User Input] -->|연락처 입력| B2[SET_CONTACT Action]
    
    B1 --> C[Reducer]
    B2 --> C
    
    C --> D1[searchForm.reservationId 업데이트]
    C --> D2[searchForm.contact 업데이트]
    
    D1 --> E[Store 상태 변경]
    D2 --> E
    
    E --> F[검색 폼 View 리렌더링]
    F --> G1[입력 필드 값 표시]
    F --> G2[조회 버튼 활성화/비활성화]
```

---

#### 5.5.2. validationErrors 상태 흐름

```mermaid
graph LR
    A[User Input] -->|입력 감지| B[실시간 검증 함수]
    
    B --> C{검증 통과?}
    
    C -->|실패| D1[SET_VALIDATION_ERROR Action]
    C -->|통과| D2[SET_VALIDATION_ERROR Action with null]
    
    D1 --> E[Reducer]
    D2 --> E
    
    E --> F1[validationErrors.field = error message]
    E --> F2[validationErrors.field = null]
    
    F1 --> G[Store 상태 변경]
    F2 --> G
    
    G --> H[검색 폼 View 리렌더링]
    
    H --> I1[오류 메시지 표시]
    H --> I2[오류 메시지 숨김]
```

---

#### 5.5.3. searchResults 상태 흐름

```mermaid
graph TB
    A[User Action] -->|조회 버튼 클릭| B[SEARCH_START Action]
    
    B --> C[Reducer]
    C --> D[isLoading = true]
    D --> E[Store 업데이트]
    E --> F[View: 로딩 스피너 표시]
    
    F --> G[API 호출]
    
    G --> H{API 응답}
    
    H -->|성공| I[SEARCH_SUCCESS Action]
    H -->|실패| J[SEARCH_FAILURE Action]
    
    I --> K[Reducer]
    J --> K
    
    K --> L1[searchResults = API 데이터]
    K --> L2[error = 오류 메시지]
    K --> L3[isLoading = false]
    
    L1 --> M[Store 업데이트]
    L2 --> M
    L3 --> M
    
    M --> N{결과 존재?}
    
    N -->|있음| O1[예약 카드 목록 렌더링]
    N -->|없음| O2[빈 상태 UI 렌더링]
    N -->|오류| O3[오류 메시지 렌더링]
```

---

#### 5.5.4. isLoading 상태 흐름

```mermaid
graph LR
    A1[SEARCH_START] --> B[Reducer]
    A2[SEARCH_SUCCESS] --> B
    A3[SEARCH_FAILURE] --> B
    
    B --> C{Action Type}
    
    C -->|SEARCH_START| D1[isLoading = true]
    C -->|SEARCH_SUCCESS| D2[isLoading = false]
    C -->|SEARCH_FAILURE| D2
    
    D1 --> E[Store 업데이트]
    D2 --> E
    
    E --> F[View 리렌더링]
    
    F --> G1[로딩 스피너 표시]
    F --> G2[로딩 스피너 숨김]
    F --> G3[버튼 비활성화]
    F --> G4[버튼 활성화]
```

---

#### 5.5.5. error 상태 흐름

```mermaid
graph TB
    A1[SEARCH_START] --> B[Reducer]
    A2[SEARCH_SUCCESS] --> B
    A3[SEARCH_FAILURE] --> B
    
    B --> C{Action Type}
    
    C -->|SEARCH_START| D1[error = null]
    C -->|SEARCH_SUCCESS| D1
    C -->|SEARCH_FAILURE| D2[error = 오류 메시지]
    
    D1 --> E[Store 업데이트]
    D2 --> E
    
    E --> F[View 리렌더링]
    
    F --> G{error 존재?}
    
    G -->|있음| H1[오류 메시지 박스 표시]
    G -->|없음| H2[오류 UI 숨김]
    
    H1 --> I[재시도 버튼 표시]
    I -->|클릭| A1
```

---

#### 5.5.6. currentPage 상태 흐름

```mermaid
graph LR
    A1[User: 페이지 클릭] --> B1[SET_CURRENT_PAGE Action]
    A2[SEARCH_START Action] --> B2[Reducer: currentPage = 1]
    
    B1 --> C[Reducer]
    
    C --> D[currentPage = payload]
    B2 --> D
    
    D --> E[Store 업데이트]
    
    E --> F[Derived Data 계산]
    F --> G[paginatedResults = searchResults.slice...]
    
    G --> H[View 리렌더링]
    
    H --> I1[해당 페이지 결과만 표시]
    H --> I2[페이지네이션 UI 업데이트]
```

---

## 6. 컴포넌트에서 사용 예시

### 6.1. Custom Hook

```typescript
// useReservationSearch.ts
import { useReducer, useCallback } from 'react';

export function useReservationSearch() {
  const [state, dispatch] = useReducer(reservationSearchReducer, initialState);
  
  // Action Creators를 래핑한 함수들
  const actions = {
    setReservationId: useCallback((value: string) => {
      dispatch(setReservationId(value));
      
      // 실시간 검증
      const error = validateReservationId(value);
      dispatch(setValidationError('reservationId', error));
    }, []),
    
    setContact: useCallback((value: string) => {
      dispatch(setContact(value));
      
      // 실시간 검증
      const error = validateContact(value);
      dispatch(setValidationError('contact', error));
    }, []),
    
    search: useCallback(async () => {
      // 최종 검증
      if (!state.searchForm.reservationId && !state.searchForm.contact) {
        dispatch(setValidationError('reservationId', '예약 번호 또는 연락처를 입력해주세요'));
        return;
      }
      
      // 검색 시작
      dispatch(searchStart());
      
      try {
        const response = await fetch(
          `/api/reservations/search?reservationId=${state.searchForm.reservationId}&contact=${state.searchForm.contact}`
        );
        const data = await response.json();
        
        if (data.ok) {
          dispatch(searchSuccess(data.data));
        } else {
          dispatch(searchFailure(data.error.message));
        }
      } catch (error) {
        dispatch(searchFailure('검색 중 오류가 발생했습니다'));
      }
    }, [state.searchForm]),
    
    setCurrentPage: useCallback((page: number) => {
      dispatch(setCurrentPage(page));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []),
    
    resetForm: useCallback(() => {
      dispatch(resetForm());
    }, []),
  };
  
  return { state, actions };
}
```

---

### 6.2. 컴포넌트에서 사용

```typescript
// ReservationSearchPage.tsx
'use client';

import { useReservationSearch } from '@/features/reservations/hooks/useReservationSearch';

export default function ReservationSearchPage() {
  const { state, actions } = useReservationSearch();
  
  const handleReservationIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setReservationId(e.target.value);
  };
  
  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setContact(e.target.value);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.search();
  };
  
  return (
    <div className="container mx-auto p-4">
      {/* 검색 폼 */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="mb-4">
          <label>예약 번호</label>
          <input
            type="text"
            value={state.searchForm.reservationId}
            onChange={handleReservationIdChange}
            placeholder="예약 번호를 입력하세요"
            className={state.validationErrors.reservationId ? 'border-red-500' : ''}
          />
          {state.validationErrors.reservationId && (
            <p className="text-red-500 text-sm">{state.validationErrors.reservationId}</p>
          )}
        </div>
        
        <div className="mb-4">
          <label>연락처</label>
          <input
            type="text"
            value={state.searchForm.contact}
            onChange={handleContactChange}
            placeholder="휴대폰 번호 또는 이메일을 입력하세요"
            className={state.validationErrors.contact ? 'border-red-500' : ''}
          />
          {state.validationErrors.contact && (
            <p className="text-red-500 text-sm">{state.validationErrors.contact}</p>
          )}
        </div>
        
        <button
          type="submit"
          disabled={state.isLoading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {state.isLoading ? '조회 중...' : '조회하기'}
        </button>
      </form>
      
      {/* 로딩 상태 */}
      {state.isLoading && <LoadingSpinner />}
      
      {/* 오류 상태 */}
      {state.error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{state.error}</p>
          <button onClick={actions.search}>다시 시도</button>
        </div>
      )}
      
      {/* 검색 결과 */}
      {!state.isLoading && state.searchResults.length > 0 && (
        <>
          <ReservationList
            reservations={paginatedResults(state.searchResults, state.currentPage)}
          />
          
          {/* 페이지네이션 */}
          {state.searchResults.length > 10 && (
            <Pagination
              currentPage={state.currentPage}
              totalPages={Math.ceil(state.searchResults.length / 10)}
              onPageChange={actions.setCurrentPage}
            />
          )}
        </>
      )}
      
      {/* 빈 상태 */}
      {!state.isLoading && state.searchResults.length === 0 && !state.error && (
        <EmptyState message="검색 결과가 없습니다" />
      )}
    </div>
  );
}
```

---

## 7. 데이터 흐름 추적

### 7.1. 정상 검색 시나리오

```mermaid
sequenceDiagram
    autonumber
    
    participant User
    participant View
    participant Hook as useReservationSearch
    participant Reducer
    participant Store
    participant API
    
    User->>View: 예약 번호 입력 "abc-123..."
    View->>Hook: actions.setReservationId("abc-123...")
    Hook->>Reducer: dispatch(SET_RESERVATION_ID)
    Reducer->>Store: searchForm.reservationId = "abc-123..."
    Store-->>View: 리렌더링 (입력 필드 업데이트)
    
    User->>View: "조회하기" 버튼 클릭
    View->>Hook: actions.search()
    Hook->>Reducer: dispatch(SEARCH_START)
    Reducer->>Store: isLoading = true
    Store-->>View: 리렌더링 (로딩 스피너 표시)
    
    Hook->>API: GET /api/reservations/search
    API-->>Hook: {ok: true, data: [...]}
    Hook->>Reducer: dispatch(SEARCH_SUCCESS, [...])
    Reducer->>Store: searchResults = [...], isLoading = false
    Store-->>View: 리렌더링 (예약 카드 목록 표시)
```

---

### 7.2. 검증 오류 시나리오

```mermaid
sequenceDiagram
    autonumber
    
    participant User
    participant View
    participant Hook
    participant Validator as 검증 함수
    participant Reducer
    participant Store
    
    User->>View: 잘못된 예약 번호 입력 "abc"
    View->>Hook: actions.setReservationId("abc")
    Hook->>Reducer: dispatch(SET_RESERVATION_ID, "abc")
    Reducer->>Store: searchForm.reservationId = "abc"
    Store-->>View: 리렌더링
    
    Hook->>Validator: validateReservationId("abc")
    Validator-->>Hook: "올바른 예약 번호 형식이 아닙니다"
    Hook->>Reducer: dispatch(SET_VALIDATION_ERROR, {...})
    Reducer->>Store: validationErrors.reservationId = "올바른..."
    Store-->>View: 리렌더링 (오류 메시지 표시)
    
    User->>View: "조회하기" 버튼 클릭 (비활성화됨)
    Note over View: 버튼이 비활성화 상태이므로<br/>아무 액션도 발생하지 않음
```

---

### 7.3. 페이지네이션 시나리오

```mermaid
sequenceDiagram
    autonumber
    
    participant User
    participant PaginationView as 페이지네이션 View
    participant Hook
    participant Reducer
    participant Store
    participant ResultView as 결과 View
    
    Note over Store: searchResults: [25개 예약]<br/>currentPage: 1
    
    User->>PaginationView: 페이지 "2" 클릭
    PaginationView->>Hook: actions.setCurrentPage(2)
    Hook->>Reducer: dispatch(SET_CURRENT_PAGE, 2)
    Reducer->>Store: currentPage = 2
    Store-->>ResultView: 리렌더링
    
    Note over ResultView: useMemo로 계산:<br/>paginatedResults = searchResults.slice(10, 20)
    
    ResultView-->>User: 11~20번 예약 표시
    Store-->>PaginationView: 리렌더링 (2번 활성화)
```

---

## 8. 성능 최적화

### 8.1. useMemo로 파생 데이터 최적화

```typescript
import { useMemo } from 'react';

function useReservationSearchSelectors(state: ReservationSearchState) {
  // 페이지네이션된 결과
  const paginatedResults = useMemo(() => {
    const ITEMS_PER_PAGE = 10;
    const startIndex = (state.currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return state.searchResults.slice(startIndex, endIndex);
  }, [state.searchResults, state.currentPage]);
  
  // 전체 페이지 수
  const totalPages = useMemo(() => {
    return Math.ceil(state.searchResults.length / 10);
  }, [state.searchResults.length]);
  
  // 검색 결과 존재 여부
  const hasSearchResults = useMemo(() => {
    return state.searchResults.length > 0;
  }, [state.searchResults.length]);
  
  // 빈 상태 표시 여부
  const showEmptyState = useMemo(() => {
    return !state.isLoading && state.searchResults.length === 0 && !state.error;
  }, [state.isLoading, state.searchResults.length, state.error]);
  
  // 페이지네이션 표시 여부
  const showPagination = useMemo(() => {
    return state.searchResults.length > 10;
  }, [state.searchResults.length]);
  
  // 조회 버튼 비활성화 여부
  const isSearchButtonDisabled = useMemo(() => {
    return (
      state.isLoading ||
      (!state.searchForm.reservationId && !state.searchForm.contact) ||
      state.validationErrors.reservationId !== null ||
      state.validationErrors.contact !== null
    );
  }, [
    state.isLoading,
    state.searchForm.reservationId,
    state.searchForm.contact,
    state.validationErrors.reservationId,
    state.validationErrors.contact,
  ]);
  
  return {
    paginatedResults,
    totalPages,
    hasSearchResults,
    showEmptyState,
    showPagination,
    isSearchButtonDisabled,
  };
}
```

---

### 8.2. useCallback로 액션 최적화

```typescript
// 이미 Custom Hook에서 useCallback 사용
// 자식 컴포넌트에 함수를 props로 전달할 때 불필요한 리렌더링 방지

const actions = {
  setReservationId: useCallback((value: string) => {
    // ...
  }, []), // 의존성 배열 비어있음 - 함수가 재생성되지 않음
  
  search: useCallback(async () => {
    // ...
  }, [state.searchForm]), // searchForm이 바뀔 때만 함수 재생성
};
```

---

## 9. 테스트 전략

### 9.1. Reducer 테스트

```typescript
// reservationSearchReducer.test.ts
describe('reservationSearchReducer', () => {
  it('should handle SET_RESERVATION_ID', () => {
    const action = setReservationId('test-id');
    const newState = reservationSearchReducer(initialState, action);
    
    expect(newState.searchForm.reservationId).toBe('test-id');
  });
  
  it('should handle SEARCH_START', () => {
    const action = searchStart();
    const newState = reservationSearchReducer(initialState, action);
    
    expect(newState.isLoading).toBe(true);
    expect(newState.error).toBe(null);
    expect(newState.currentPage).toBe(1);
  });
  
  it('should handle SEARCH_SUCCESS', () => {
    const mockResults = [{ id: '1', concertTitle: 'Test Concert', /* ... */ }];
    const action = searchSuccess(mockResults);
    const newState = reservationSearchReducer(initialState, action);
    
    expect(newState.isLoading).toBe(false);
    expect(newState.searchResults).toEqual(mockResults);
  });
  
  it('should handle SEARCH_FAILURE', () => {
    const action = searchFailure('Test error');
    const newState = reservationSearchReducer(initialState, action);
    
    expect(newState.isLoading).toBe(false);
    expect(newState.error).toBe('Test error');
  });
});
```

---

### 9.2. Custom Hook 테스트

```typescript
// useReservationSearch.test.ts
import { renderHook, act } from '@testing-library/react';
import { useReservationSearch } from './useReservationSearch';

describe('useReservationSearch', () => {
  it('should update reservation ID', () => {
    const { result } = renderHook(() => useReservationSearch());
    
    act(() => {
      result.current.actions.setReservationId('test-id');
    });
    
    expect(result.current.state.searchForm.reservationId).toBe('test-id');
  });
  
  it('should set validation error for invalid reservation ID', () => {
    const { result } = renderHook(() => useReservationSearch());
    
    act(() => {
      result.current.actions.setReservationId('invalid');
    });
    
    expect(result.current.state.validationErrors.reservationId).toBeTruthy();
  });
  
  it('should handle search flow', async () => {
    const { result } = renderHook(() => useReservationSearch());
    
    // 예약 번호 설정
    act(() => {
      result.current.actions.setReservationId('valid-uuid-...');
    });
    
    // 검색 실행
    await act(async () => {
      await result.current.actions.search();
    });
    
    // 로딩이 완료되었는지 확인
    expect(result.current.state.isLoading).toBe(false);
  });
});
```

---

## 10. 요약

### 10.1. Flux 패턴의 장점

1. **단방향 데이터 흐름**: Action → Reducer → Store → View의 예측 가능한 흐름
2. **상태 관리 중앙화**: 모든 상태가 한 곳에서 관리되어 디버깅이 쉬움
3. **순수 함수 Reducer**: 부수 효과 없이 테스트하기 쉬움
4. **시간 여행 디버깅**: 액션 히스토리를 추적하여 상태 변화 재현 가능
5. **타입 안전성**: TypeScript와 함께 사용하여 컴파일 타임 오류 방지

### 10.2. 핵심 구성 요소

| 요소 | 역할 | 구현 |
|-----|------|------|
| **Action** | 상태 변경 의도 표현 | Action Creator 함수 |
| **Reducer** | 상태 변경 로직 | reservationSearchReducer 함수 |
| **Store** | 상태 저장소 | useReducer 훅 |
| **View** | UI 렌더링 | React 컴포넌트 |

### 10.3. 상태별 Action 매핑

| 상태 | 관련 Actions |
|-----|-------------|
| `searchForm` | SET_RESERVATION_ID, SET_CONTACT, RESET_FORM |
| `validationErrors` | SET_VALIDATION_ERROR, CLEAR_VALIDATION_ERRORS |
| `searchResults` | SEARCH_SUCCESS |
| `isLoading` | SEARCH_START, SEARCH_SUCCESS, SEARCH_FAILURE |
| `error` | SEARCH_FAILURE, SEARCH_START, SEARCH_SUCCESS |
| `currentPage` | SET_CURRENT_PAGE, SEARCH_START |

### 10.4. 구현 체크리스트

- [x] Action Types 정의
- [x] Action Creators 구현
- [x] Action 타입 정의 (TypeScript)
- [x] State 타입 정의
- [x] Initial State 정의
- [x] Reducer 함수 구현
- [x] Custom Hook 구현 (useReservationSearch)
- [x] Selectors 구현 (useMemo)
- [x] 컴포넌트 통합
- [x] 테스트 작성

---

이 Flux 패턴 설계를 기반으로 예약 조회 페이지의 상태 관리를 구현하면, 명확하고 예측 가능하며 유지보수하기 쉬운 코드를 작성할 수 있습니다.

