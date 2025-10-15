# Usecase #5: 예약 완료 처리 (고객 정보 입력 및 예약 확정)

## 1. Primary Actor
- 일반 사용자 (콘서트 예매를 원하는 사람)

## 2. Precondition
- 사용자가 콘서트 예약 페이지에 진입한 상태
- 날짜, 회차, 좌석을 모두 선택한 상태 (최소 1석 이상)
- 선택한 좌석이 아직 예약 가능한 상태 (reserved 되지 않음)

## 3. Trigger
- 사용자가 '좌석 선택 완료' 버튼을 클릭

## 4. Main Scenario

### Step 1: 좌석 선택 완료 버튼 클릭
- 사용자가 좌석을 선택 후 '좌석 선택 완료' 버튼 클릭
- 시스템이 선택된 좌석 정보의 유효성을 서버에서 재검증
- 모든 좌석이 예약 가능한 상태이면 고객 정보 입력 폼을 표시

### Step 2: 고객 정보 입력
- 사용자가 이름을 입력 (필수, 2-50자)
- 사용자가 휴대폰 번호를 입력 (필수, 010-XXXX-XXXX 형식)
- 사용자가 이메일 주소를 입력 (선택)
- 각 필드에서 실시간 유효성 검증 수행

### Step 3: 예약 확정 처리
- 사용자가 '예약 확정' 버튼 클릭
- 시스템이 최종적으로 좌석 상태를 재확인 (동시성 검증)
- Reservation 테이블에 새 예약 레코드 생성
- 선택된 좌석들의 status를 'reserved'로 업데이트
- 예약 번호 생성 (UUID)
- 트랜잭션 커밋 및 예약 완료

### Step 4: 예약 완료 페이지 이동
- 사용자를 예약 완료 페이지(`/booking/success?reservationId={id}`)로 리다이렉트
- 예약 번호 및 예약 정보를 쿼리 파라미터로 전달
- 예약 완료 페이지에서 예약 상세 정보 API(`GET /api/reservations/:reservationId`) 호출
- 예약 번호(reservationNumber), 콘서트 정보, 좌석 정보, 고객 정보, 총 결제 금액 표시

## 5. Edge Cases

### Case 1: 좌석 선택 없이 버튼 클릭
- **상황**: 사용자가 좌석을 선택하지 않고 '좌석 선택 완료' 버튼 클릭
- **처리**: 버튼 비활성화 또는 "최소 1개 이상의 좌석을 선택해주세요" 토스트 메시지 표시

### Case 2: 좌석 유효성 검증 실패 (동시성 충돌)
- **상황**: 고객 정보 입력 중 다른 사용자가 동일 좌석을 예약 완료
- **처리**: "선택하신 좌석이 이미 예약되었습니다. 다른 좌석을 선택해주세요" 에러 메시지 표시 후 좌석 선택 단계로 복귀

### Case 3: 고객 정보 입력 오류
- **상황**: 이름이 너무 짧거나 길거나, 휴대폰 번호 형식이 틀린 경우
- **처리**: 해당 필드 하단에 구체적인 오류 메시지 실시간 표시 (예: "휴대폰 번호는 010-1234-5678 형식으로 입력해주세요")

### Case 4: 중복 예약 시도
- **상황**: 동일한 휴대폰 번호로 같은 공연(같은 회차)에 대한 예약이 이미 존재
- **처리**: "이미 해당 공연에 대한 예약이 존재합니다" 경고 메시지 표시 및 예약 진행 차단

### Case 5: 네트워크 오류
- **상황**: 예약 확정 요청 중 네트워크 오류 발생
- **처리**: "예약 처리 중 오류가 발생했습니다. 다시 시도해주세요" 에러 메시지 표시, 입력한 고객 정보는 유지, 재시도 버튼 제공

### Case 6: 서버 오류
- **상황**: 데이터베이스 트랜잭션 실패 또는 서버 내부 오류
- **처리**: "예약 처리에 실패했습니다. 잠시 후 다시 시도해주세요" 에러 메시지 표시 및 고객센터 연락처 제공

### Case 8: API 응답 데이터 구조 불일치
- **상황**: 백엔드 API 응답 구조가 프론트엔드 예상과 다르거나 `data` 필드가 누락된 경우
- **처리**: 응답 데이터 접근 전 null/undefined 체크, 옵셔널 체이닝 사용, 예외 처리 및 사용자 친화적 에러 메시지 표시

### Case 9: 예약 완료 페이지 조회 실패
- **상황**: 예약은 성공했으나 예약 상세 조회 API 호출 실패
- **처리**: 로딩 인디케이터 표시 후 재시도 옵션 제공, 실패 시 예약 번호만이라도 표시

### Case 7: 이메일 형식 오류
- **상황**: 선택 입력인 이메일 필드에 잘못된 형식 입력
- **처리**: "올바른 이메일 형식이 아닙니다 (예: example@domain.com)" 오류 메시지 표시

## 6. Business Rules

### Rule 1: 필수 입력 항목
- 이름: 필수, 2-50자, 한글/영문/공백만 허용
- 휴대폰 번호: 필수, 한국 휴대폰 번호 형식 (010-XXXX-XXXX)
- 이메일: 선택, 입력 시 이메일 형식 검증 필요

### Rule 2: 최대 좌석 선택 제한
- 한 번의 예약에서 최대 4석까지 선택 가능
- 최소 1석 이상 선택 필수

### Rule 3: 좌석 상태 검증
- 예약 확정 전 반드시 최종 좌석 상태를 서버에서 재확인
- 하나라도 'reserved' 상태로 변경된 좌석이 있으면 전체 예약 실패

### Rule 4: 트랜잭션 처리
- Reservation 생성과 Seat status 업데이트는 하나의 트랜잭션으로 처리
- 트랜잭션 실패 시 모든 변경사항 롤백

### Rule 5: 예약 번호 생성
- 예약 번호는 UUID 형식으로 자동 생성
- 고유성 보장

### Rule 6: 중복 예약 방지
- 동일 휴대폰 번호로 같은 회차에 대한 중복 예약 차단
- 단, 다른 회차는 허용

### Rule 7: 데이터 일관성
- 예약 생성 시 reservationId, scheduleId, customerName, phoneNumber는 필수
- Seat 테이블의 reservationId는 Reservation 테이블의 id를 참조

---

## 7. Sequence Diagram

\`\`\`plantuml
@startuml
actor User
participant FE as "Frontend\n(React Component)"
participant BE as "Backend\n(Hono API)"
participant Database as "Database\n(Supabase)"

== Step 1: 좌석 선택 완료 ==
User -> FE: '좌석 선택 완료' 버튼 클릭
FE -> BE: POST /api/booking/validate-seats\n{scheduleId, seatIds[]}
BE -> Database: SELECT status FROM seats\nWHERE id IN (seatIds)
Database --> BE: 좌석 상태 목록
alt 모든 좌석 available
  BE --> FE: {success: true}
  FE --> User: 고객 정보 입력 폼 표시
else 하나 이상 reserved
  BE --> FE: {success: false, message: "좌석 예약 불가"}
  FE --> User: 에러 메시지 표시\n(좌석 선택 단계로 복귀)
end

== Step 2: 고객 정보 입력 ==
User -> FE: 이름 입력
FE -> FE: 실시간 검증 (2-50자)
User -> FE: 휴대폰 번호 입력
FE -> FE: 실시간 검증 (010-XXXX-XXXX)
User -> FE: 이메일 입력 (선택)
FE -> FE: 실시간 검증 (이메일 형식)

== Step 3: 예약 확정 처리 ==
User -> FE: '예약 확정' 버튼 클릭
FE -> BE: POST /api/booking/reserve\n{scheduleId, seatIds[], customerName, phoneNumber, email}

BE -> Database: BEGIN TRANSACTION

BE -> Database: SELECT status FROM seats\nWHERE id IN (seatIds) FOR UPDATE
Database --> BE: 좌석 상태 목록 (락 획득)

alt 모든 좌석 available
  BE -> Database: SELECT * FROM reservations\nWHERE phoneNumber = ? AND scheduleId = ?
  Database --> BE: 기존 예약 조회 결과
  
  alt 중복 예약 없음
    BE -> Database: INSERT INTO reservations\n(id, scheduleId, customerName, phoneNumber, email, status)
    Database --> BE: 예약 레코드 생성 완료
    
    BE -> Database: UPDATE seats\nSET status='reserved', reservationId=?\nWHERE id IN (seatIds)
    Database --> BE: 좌석 상태 업데이트 완료
    
    BE -> Database: COMMIT
    Database --> BE: 트랜잭션 커밋 완료
    
    BE --> FE: {success: true, reservationId: UUID}
    FE --> User: 예약 완료 페이지로 이동\n(예약 번호 표시)
  else 중복 예약 존재
    BE -> Database: ROLLBACK
    BE --> FE: {success: false, message: "이미 예약 존재"}
    FE --> User: 중복 예약 에러 메시지
  end
else 하나 이상 reserved
  BE -> Database: ROLLBACK
  BE --> FE: {success: false, message: "좌석 예약 불가"}
  FE --> User: 동시성 충돌 에러 메시지\n(좌석 선택 단계로 복귀)
end

== Step 4: 예약 완료 페이지 이동 ==
FE -> FE: 세션 데이터 정리
FE --> User: 예약 완료 페이지 렌더링

@enduml
\`\`\`

