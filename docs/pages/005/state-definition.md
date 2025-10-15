# 상태 정의: 예약 완료 처리 (고객 정보 입력 및 예약 확정)

## 1. 관리해야 할 상태 데이터 목록

### 1.1. UI 상태 (UI State)

| 상태 이름 | 타입 | 초기값 | 설명 |
|----------|------|--------|------|
| `isModalOpen` | boolean | false | 고객 정보 입력 모달 표시 여부 |
| `isValidating` | boolean | false | 좌석 유효성 검증 진행 중 여부 |
| `isSubmitting` | boolean | false | 예약 확정 처리 진행 중 여부 |
| `showRetryButton` | boolean | false | 네트워크 오류 시 재시도 버튼 표시 여부 |

### 1.2. 폼 입력 상태 (Form Input State)

| 상태 이름 | 타입 | 초기값 | 설명 |
|----------|------|--------|------|
| `customerName` | string | "" | 예약자 이름 입력값 |
| `phoneNumber` | string | "" | 예약자 휴대폰 번호 입력값 (010-XXXX-XXXX) |
| `email` | string | "" | 예약자 이메일 입력값 (선택) |

### 1.3. 폼 검증 상태 (Form Validation State)

| 상태 이름 | 타입 | 초기값 | 설명 |
|----------|------|--------|------|
| `nameError` | string \| null | null | 이름 필드 오류 메시지 |
| `phoneError` | string \| null | null | 휴대폰 번호 필드 오류 메시지 |
| `emailError` | string \| null | null | 이메일 필드 오류 메시지 |
| `isNameValid` | boolean | false | 이름 유효성 검증 통과 여부 |
| `isPhoneValid` | boolean | false | 휴대폰 번호 유효성 검증 통과 여부 |
| `isEmailValid` | boolean | true | 이메일 유효성 검증 통과 여부 (선택이므로 기본 true) |

### 1.4. 오류 상태 (Error State)

| 상태 이름 | 타입 | 초기값 | 설명 |
|----------|------|--------|------|
| `apiError` | object \| null | null | API 오류 정보 `{ code, message }` |
| `validationError` | string \| null | null | 좌석 유효성 검증 오류 메시지 |

### 1.5. 예약 결과 상태 (Reservation Result State)

| 상태 이름 | 타입 | 초기값 | 설명 |
|----------|------|--------|------|
| `reservationId` | string \| null | null | 생성된 예약 ID (UUID) |

---

## 2. 상태가 아닌 화면 표시 데이터 (Derived Data)

이 데이터들은 화면에 보여지지만, 다른 상태로부터 **계산되거나 파생**되므로 별도의 상태로 관리하지 않습니다.

| 데이터 이름 | 계산 방법 | 설명 |
|------------|----------|------|
| `selectedSeats` | `context` 또는 `props`로부터 전달받음 | 이전 단계(좌석 선택)에서 선택된 좌석 목록 |
| `totalPrice` | `selectedSeats.reduce((sum, seat) => sum + seat.price, 0)` | 선택된 좌석 가격의 합계 |
| `seatCount` | `selectedSeats.length` | 선택된 좌석 개수 |
| `isCompleteButtonEnabled` | `seatCount > 0` | '좌석 선택 완료' 버튼 활성화 여부 |
| `isReserveButtonEnabled` | `isNameValid && isPhoneValid && isEmailValid && !isSubmitting` | '예약 확정' 버튼 활성화 여부 |
| `formattedPhoneNumber` | `phoneNumber.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3')` | 자동 포맷팅된 휴대폰 번호 |
| `scheduleId` | `context` 또는 `props`로부터 전달받음 | 선택된 회차 ID |
| `concertInfo` | `context` 또는 `props`로부터 전달받음 | 콘서트 기본 정보 (제목, 포스터 등) |

---

## 3. 상태 변경 조건 및 화면 변화

### 3.1. UI 상태 (isModalOpen)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 페이지 로드 | `false` | 모달 숨김, 예매 정보 섹션만 표시 |
| **모달 열기** | '좌석 선택 완료' 버튼 클릭 → 좌석 유효성 검증 성공 | `true` | 고객 정보 입력 모달 표시 (페이드 인 + 스케일 업 애니메이션), 오버레이 배경 표시 |
| **모달 닫기** | '취소' 버튼 클릭 또는 모달 외부 클릭 또는 ESC 키 | `false` | 모달 숨김 (페이드 아웃 애니메이션), 입력 데이터 초기화 |
| **예약 성공** | 예약 확정 성공 후 | `false` | 모달 닫힘, 예약 완료 페이지로 리다이렉트 |

### 3.2. UI 상태 (isValidating)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 페이지 로드 | `false` | 일반 화면 표시 |
| **검증 시작** | '좌석 선택 완료' 버튼 클릭 | `true` | 로딩 오버레이 표시, 스피너 + "좌석 확인 중..." 텍스트, 버튼 비활성화 |
| **검증 완료** | API 응답 수신 (성공 또는 실패) | `false` | 로딩 오버레이 숨김 |

### 3.3. UI 상태 (isSubmitting)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 모달 오픈 | `false` | '예약 확정' 버튼 정상 상태 |
| **제출 시작** | '예약 확정' 버튼 클릭 | `true` | 버튼 텍스트 "예약 확정" → "처리 중...", 버튼 내 스피너 표시, 버튼 비활성화, 모든 입력 필드 비활성화 |
| **제출 완료** | API 응답 수신 (성공 또는 실패) | `false` | 버튼 정상 상태 복원 (실패 시) 또는 모달 닫힘 (성공 시) |

### 3.4. UI 상태 (showRetryButton)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 모달 오픈 | `false` | 재시도 버튼 숨김 |
| **네트워크 오류** | 예약 확정 요청 중 네트워크 오류 발생 | `true` | 모달 하단에 '재시도' 버튼 표시, 에러 토스트 표시 |
| **재시도 클릭** | '재시도' 버튼 클릭 | `false` | 재시도 버튼 숨김, 예약 확정 재시도 |
| **재시도 성공** | 재시도 후 예약 성공 | `false` | 재시도 버튼 숨김, 예약 완료 페이지로 이동 |

---

## 4. 폼 입력 상태 변경 및 화면 변화

### 4.1. 이름 입력 (customerName)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 모달 오픈 | `""` | 빈 입력 필드, 플레이스홀더 "홍길동" 표시 |
| **입력 중** | 사용자가 이름 입력 (onChange) | 입력된 문자열 | 입력값 실시간 반영, 실시간 검증 실행 |
| **유효성 검증 실행** | 입력값 변경 시마다 | 입력된 문자열 | `isNameValid` 및 `nameError` 상태 업데이트 → 아래 참조 |
| **모달 닫기** | 모달 닫힘 | `""` | 입력값 초기화 |

### 4.2. 휴대폰 번호 입력 (phoneNumber)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 모달 오픈 | `""` | 빈 입력 필드, 플레이스홀더 "010-1234-5678" 표시 |
| **입력 중** | 사용자가 숫자 입력 (onChange) | 숫자만 추출 후 자동 하이픈 삽입 | 입력값 실시간 반영 (010-XXXX-XXXX 형식), 실시간 검증 실행 |
| **자동 포맷팅** | 숫자 입력 시 | `formattedPhoneNumber` | 하이픈 자동 삽입 (예: 01012345678 → 010-1234-5678) |
| **유효성 검증 실행** | 입력값 변경 시마다 | 입력된 문자열 | `isPhoneValid` 및 `phoneError` 상태 업데이트 → 아래 참조 |
| **모달 닫기** | 모달 닫힘 | `""` | 입력값 초기화 |

### 4.3. 이메일 입력 (email)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 모달 오픈 | `""` | 빈 입력 필드, 플레이스홀더 "example@domain.com" 표시 |
| **입력 중** | 사용자가 이메일 입력 (onChange) | 입력된 문자열 | 입력값 실시간 반영, 실시간 검증 실행 (값이 있을 경우에만) |
| **유효성 검증 실행** | 입력값 변경 시마다 (값이 있을 경우) | 입력된 문자열 | `isEmailValid` 및 `emailError` 상태 업데이트 → 아래 참조 |
| **선택 입력** | 비어있는 상태 | `""` | 검증 생략, `isEmailValid = true` 유지 |
| **모달 닫기** | 모달 닫힘 | `""` | 입력값 초기화 |

---

## 5. 폼 검증 상태 변경 및 화면 변화

### 5.1. 이름 검증 (nameError, isNameValid)

| 검증 조건 | nameError | isNameValid | 화면 변화 |
|----------|-----------|-------------|----------|
| **초기 상태** | `null` | `false` | 오류 메시지 없음, 일반 테두리 |
| **2자 미만** | `"이름은 최소 2자 이상 입력해주세요"` | `false` | 필드 하단에 빨간색 오류 메시지 표시, 필드 테두리 빨간색 (#EF4444), 느낌표 아이콘 |
| **50자 초과** | `"이름은 최대 50자까지 입력 가능합니다"` | `false` | 필드 하단에 빨간색 오류 메시지 표시, 필드 테두리 빨간색 |
| **특수문자 포함** | `"이름은 한글, 영문, 공백만 입력 가능합니다"` | `false` | 필드 하단에 빨간색 오류 메시지 표시, 필드 테두리 빨간색 |
| **유효함** | `null` | `true` | 오류 메시지 숨김, 필드 테두리 초록색 (#10B981), 체크 아이콘 표시 |

### 5.2. 휴대폰 번호 검증 (phoneError, isPhoneValid)

| 검증 조건 | phoneError | isPhoneValid | 화면 변화 |
|----------|-----------|-------------|----------|
| **초기 상태** | `null` | `false` | 오류 메시지 없음, 일반 테두리 |
| **형식 불일치** | `"휴대폰 번호는 010-1234-5678 형식으로 입력해주세요"` | `false` | 필드 하단에 빨간색 오류 메시지 표시, 필드 테두리 빨간색 |
| **유효함** | `null` | `true` | 오류 메시지 숨김, 필드 테두리 초록색, 체크 아이콘 표시 |

### 5.3. 이메일 검증 (emailError, isEmailValid)

| 검증 조건 | emailError | isEmailValid | 화면 변화 |
|----------|-----------|-------------|----------|
| **초기 상태** | `null` | `true` | 오류 메시지 없음, 일반 테두리 (선택 입력이므로 기본 유효) |
| **비어있음** | `null` | `true` | 오류 메시지 없음, 일반 테두리 (선택 입력이므로 유효) |
| **형식 불일치** | `"올바른 이메일 형식이 아닙니다 (예: example@domain.com)"` | `false` | 필드 하단에 빨간색 오류 메시지 표시, 필드 테두리 빨간색 |
| **유효함** | `null` | `true` | 오류 메시지 숨김, 필드 테두리 초록색, 체크 아이콘 표시 |

---

## 6. 오류 상태 변경 및 화면 변화

### 6.1. 좌석 유효성 검증 오류 (validationError)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 페이지 로드 | `null` | 오류 없음 |
| **좌석 예약됨** | '좌석 선택 완료' 클릭 → API 응답 실패 (SEATS_NOT_AVAILABLE) | `"선택하신 좌석이 이미 예약되었습니다. 다른 좌석을 선택해주세요"` | 에러 토스트 표시 (빨간색 배경, 6초 지속), 좌석 배치도 자동 새로고침, 예약된 좌석 비활성화 |
| **오류 해소** | 다른 좌석 재선택 | `null` | 토스트 사라짐, 정상 화면 |

### 6.2. API 오류 (apiError)

| 상태 | 변경 조건 | apiError.code | apiError.message | 화면 변화 |
|------|----------|--------------|------------------|----------|
| **초기** | 모달 오픈 | `null` | `null` | 오류 없음 |
| **동시성 충돌** | '예약 확정' 클릭 → API 응답 실패 | `"SEATS_NOT_AVAILABLE"` | `"선택하신 좌석이 이미 예약되었습니다"` | 에러 토스트 표시, 모달 닫힘, 좌석 선택 단계로 복귀 |
| **중복 예약** | '예약 확정' 클릭 → API 응답 실패 | `"DUPLICATE_RESERVATION"` | `"이미 해당 공연에 대한 예약이 존재합니다"` | 에러 토스트 표시, 모달 유지 (다른 번호 입력 가능) |
| **입력 오류** | '예약 확정' 클릭 → API 응답 실패 | `"INVALID_INPUT"` | `"입력 정보가 올바르지 않습니다"` | 에러 토스트 표시, 모달 유지 |
| **네트워크 오류** | '예약 확정' 클릭 → 네트워크 실패 | `"NETWORK_ERROR"` | `"예약 처리 중 오류가 발생했습니다. 다시 시도해주세요"` | 에러 토스트 표시 (자동 닫히지 않음), 모달 하단에 '재시도' 버튼 표시, `showRetryButton = true` |
| **서버 오류** | '예약 확정' 클릭 → 서버 500 오류 | `"INTERNAL_SERVER_ERROR"` | `"예약 처리에 실패했습니다. 잠시 후 다시 시도해주세요"` | 에러 토스트 표시 (자동 닫히지 않음), 모달 하단에 고객센터 연락처 표시 |
| **오류 해소** | 재시도 성공 또는 모달 닫기 | `null` | `null` | 토스트 사라짐, 정상 화면 |

---

## 7. 예약 결과 상태 (reservationId)

| 상태 | 변경 조건 | 변경 후 값 | 화면 변화 |
|------|----------|-----------|----------|
| **초기** | 모달 오픈 | `null` | 예약 전 상태 |
| **예약 성공** | '예약 확정' 클릭 → API 응답 성공 | UUID 문자열 (예: `"550e8400-e29b-41d4-a716-446655440000"`) | 모달 닫힘, 예약 완료 페이지로 리다이렉트 (`/booking/success?reservationId={UUID}`) |

---

## 8. 복합 상태에 따른 버튼 활성화

### 8.1. '좌석 선택 완료' 버튼

| 조건 | 버튼 활성화 여부 | 버튼 스타일 |
|------|----------------|-----------|
| `seatCount === 0` | 비활성화 | 배경: 회색 (#9CA3AF), 커서: not-allowed |
| `seatCount > 0` | 활성화 | 배경: Primary Color (#5C6BFF), 호버 시 #4854FF, 커서: pointer |
| `isValidating === true` | 비활성화 | 배경: 회색, 로딩 스피너 표시 |

### 8.2. '예약 확정' 버튼

| 조건 | 버튼 활성화 여부 | 버튼 스타일 |
|------|----------------|-----------|
| `isNameValid === false` | 비활성화 | 배경: 회색 (#9CA3AF), 커서: not-allowed |
| `isPhoneValid === false` | 비활성화 | 배경: 회색, 커서: not-allowed |
| `isEmailValid === false` | 비활성화 | 배경: 회색, 커서: not-allowed |
| `isSubmitting === true` | 비활성화 | 배경: Primary Color, 텍스트 "처리 중...", 스피너 표시 |
| `isNameValid && isPhoneValid && isEmailValid && !isSubmitting` | 활성화 | 배경: Primary Color (#5C6BFF), 호버 시 #4854FF, 커서: pointer |

---

## 9. 상태 전환 다이어그램

```
[초기 상태]
  ↓
[좌석 선택]
  → seatCount > 0
  → isCompleteButtonEnabled = true
  ↓
['좌석 선택 완료' 버튼 클릭]
  → isValidating = true
  → 로딩 오버레이 표시
  ↓
[좌석 유효성 검증 (API 호출)]
  ↓
  ├─ [성공]
  │   → isValidating = false
  │   → isModalOpen = true
  │   → 고객 정보 입력 모달 표시
  │   ↓
  │  [사용자 정보 입력]
  │   → customerName, phoneNumber, email 업데이트
  │   → 실시간 검증: isNameValid, isPhoneValid, isEmailValid 업데이트
  │   ↓
  │  [모든 필수 입력 유효]
  │   → isReserveButtonEnabled = true
  │   ↓
  │  ['예약 확정' 버튼 클릭]
  │   → isSubmitting = true
  │   → 버튼 로딩 상태
  │   ↓
  │  [예약 확정 처리 (API 호출)]
  │   ↓
  │   ├─ [성공]
  │   │   → isSubmitting = false
  │   │   → reservationId = UUID
  │   │   → isModalOpen = false
  │   │   → 예약 완료 페이지로 리다이렉트
  │   │
  │   ├─ [실패: 동시성 충돌]
  │   │   → isSubmitting = false
  │   │   → apiError = { code: "SEATS_NOT_AVAILABLE", ... }
  │   │   → 에러 토스트 표시
  │   │   → isModalOpen = false
  │   │   → 좌석 선택 단계로 복귀
  │   │
  │   ├─ [실패: 중복 예약]
  │   │   → isSubmitting = false
  │   │   → apiError = { code: "DUPLICATE_RESERVATION", ... }
  │   │   → 에러 토스트 표시
  │   │   → 모달 유지
  │   │
  │   └─ [실패: 네트워크 오류]
  │       → isSubmitting = false
  │       → apiError = { code: "NETWORK_ERROR", ... }
  │       → showRetryButton = true
  │       → 에러 토스트 표시
  │       → 모달 유지
  │
  └─ [실패: 좌석 예약됨]
      → isValidating = false
      → validationError = "좌석 예약됨"
      → 에러 토스트 표시
      → 좌석 배치도 새로고침
```

---

## 10. 상태 관리 전략

### 10.1. 권장 상태 관리 도구

#### 10.1.1. React Hook Form
- **대상 상태**: `customerName`, `phoneNumber`, `email`, 모든 검증 상태
- **이유**: 
  - 폼 입력 및 검증 로직을 효율적으로 관리
  - 실시간 검증 및 에러 메시지 처리 내장
  - 성능 최적화 (불필요한 리렌더링 방지)

#### 10.1.2. React State (useState)
- **대상 상태**: `isModalOpen`, `isValidating`, `isSubmitting`, `showRetryButton`, `apiError`, `validationError`, `reservationId`
- **이유**: 
  - 단순한 UI 상태는 로컬 상태로 충분
  - 컴포넌트 수준에서만 사용되는 상태

#### 10.1.3. Context (선택)
- **대상 상태**: `selectedSeats`, `scheduleId`, `concertInfo`
- **이유**: 
  - 여러 단계에 걸쳐 공유되는 데이터
  - Props drilling 방지

### 10.2. 상태 초기화 시점

| 상태 그룹 | 초기화 시점 | 이유 |
|----------|-----------|------|
| **모든 폼 입력 상태** | 모달 닫힘 시 | 다음 예약 시도 시 깨끗한 상태로 시작 |
| **모든 검증 상태** | 모달 닫힘 시 | 이전 검증 결과가 남아있지 않도록 |
| **오류 상태** | 새로운 API 호출 시작 시 | 이전 오류 메시지 클리어 |
| **예약 결과 상태** | 예약 완료 페이지 이동 후 | 메모리 정리 |

### 10.3. 상태 영속성 (Persistence)

| 상태 | 영속성 필요 여부 | 저장 위치 | 이유 |
|------|----------------|----------|------|
| **폼 입력 상태** | 불필요 | - | 보안상 입력 정보를 저장하지 않음 |
| **선택된 좌석** | 필요 (선택) | SessionStorage | 페이지 새로고침 시에도 좌석 선택 유지 (5분 TTL) |
| **예약 ID** | 불필요 | - | URL 파라미터로 전달 |

---

## 11. 상태 디버깅 체크리스트

개발 중 상태 관련 이슈 디버깅 시 확인할 사항:

- [ ] `isModalOpen`이 `true`인데 모달이 보이지 않는가? → CSS z-index 또는 오버레이 문제
- [ ] `isReserveButtonEnabled`가 `true`인데 버튼이 비활성화되어 있는가? → 조건 로직 재확인
- [ ] 폼 입력 후 검증이 실행되지 않는가? → `onChange` 이벤트 핸들러 연결 확인
- [ ] 모달을 닫았는데 입력 데이터가 남아있는가? → 초기화 로직 실행 확인
- [ ] API 오류 후 재시도가 안 되는가? → `apiError` 상태 초기화 확인
- [ ] `isSubmitting`이 `false`로 돌아오지 않는가? → API 응답 핸들러의 finally 블록 확인
- [ ] 좌석 유효성 검증 후 모달이 열리지 않는가? → `isValidating` 상태 전환 확인

---

## 12. 예시 코드 스니펫

### 12.1. React Hook Form을 사용한 폼 상태 관리

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const customerInfoSchema = z.object({
  customerName: z.string()
    .min(2, '이름은 최소 2자 이상 입력해주세요')
    .max(50, '이름은 최대 50자까지 입력 가능합니다')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름은 한글, 영문, 공백만 입력 가능합니다'),
  phoneNumber: z.string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-1234-5678 형식으로 입력해주세요'),
  email: z.string()
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
});

type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

function CustomerInfoModal() {
  const {
    register,
    handleSubmit,
    formState: { errors, isValid },
    reset,
  } = useForm<CustomerInfoFormData>({
    resolver: zodResolver(customerInfoSchema),
    mode: 'onChange', // 실시간 검증
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const onSubmit = async (data: CustomerInfoFormData) => {
    setIsSubmitting(true);
    try {
      const response = await reserveSeats({
        ...data,
        scheduleId,
        seatIds,
      });
      // 예약 성공 처리
    } catch (error) {
      // 오류 처리
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    reset(); // 폼 상태 초기화
  };

  return (
    <Modal open={isModalOpen} onClose={handleCloseModal}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <input
          {...register('customerName')}
          placeholder="홍길동"
        />
        {errors.customerName && (
          <span className="error">{errors.customerName.message}</span>
        )}

        <input
          {...register('phoneNumber')}
          placeholder="010-1234-5678"
        />
        {errors.phoneNumber && (
          <span className="error">{errors.phoneNumber.message}</span>
        )}

        <input
          {...register('email')}
          placeholder="example@domain.com"
        />
        {errors.email && (
          <span className="error">{errors.email.message}</span>
        )}

        <button
          type="submit"
          disabled={!isValid || isSubmitting}
        >
          {isSubmitting ? '처리 중...' : '예약 확정'}
        </button>
      </form>
    </Modal>
  );
}
```

### 12.2. useState를 사용한 UI 상태 관리

```typescript
function BookingCompletionFlow() {
  // UI 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showRetryButton, setShowRetryButton] = useState(false);
  
  // 오류 상태
  const [apiError, setApiError] = useState<ApiError | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);
  
  // 예약 결과
  const [reservationId, setReservationId] = useState<string | null>(null);

  const handleCompleteSelection = async () => {
    setIsValidating(true);
    setValidationError(null);
    
    try {
      const result = await validateSeats({ scheduleId, seatIds });
      if (result.success) {
        setIsModalOpen(true);
      } else {
        setValidationError(result.error.message);
        // 에러 토스트 표시
      }
    } catch (error) {
      setValidationError('좌석 확인 중 오류가 발생했습니다');
    } finally {
      setIsValidating(false);
    }
  };

  // ... 나머지 로직
}
```

---

이 상태 정의 문서는 개발 시 참고용으로 사용하며, 실제 구현 시 프로젝트 구조와 팀 컨벤션에 맞게 조정할 수 있습니다.

