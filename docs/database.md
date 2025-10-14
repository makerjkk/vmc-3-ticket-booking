# 콘서트 예매 시스템 데이터베이스 설계

## 개요

본 문서는 VMC3 콘서트 예매 시스템의 데이터베이스 스키마와 데이터플로우를 정의합니다. PRD와 유저플로우에 명시적으로 포함된 데이터만을 기반으로 최소 스펙의 PostgreSQL 데이터베이스를 설계했습니다.

---

## 📊 **데이터플로우 개요**

### **1. 콘서트 목록 조회 플로우**
```
Concert 테이블 조회
    ↓
Schedule 테이블과 JOIN (미래 일정 존재 여부 확인)
    ↓
예매 가능한 콘서트 목록 반환 (id, title, posterImageUrl)
```

### **2. 예약 페이지 데이터 로드 플로우**
```
Concert 테이블에서 기본 정보 조회 (title, posterImageUrl, description)
    ↓
Schedule 테이블에서 해당 콘서트의 모든 일정 조회 (현재 날짜 이후)
    ↓
날짜별 그룹화 → 캘린더 활성 날짜 생성
    ↓
특정 날짜 선택 시 → 해당 날짜의 회차 목록 조회
    ↓
특정 회차 선택 시 → Seat 테이블에서 좌석 배치도 데이터 조회
```

### **3. 좌석 상태 실시간 동기화 플로우**
```
Seat 테이블 실시간 조회 (status 필드 기준)
    ↓
WebSocket/폴링을 통한 클라이언트 업데이트
    ↓
Redis 기반 좌석 락(Lock) 관리
```

### **4. 예약 생성 플로우**
```
좌석 선택 완료 → 임시 홀드 (Redis)
    ↓
고객 정보 입력 및 검증
    ↓
트랜잭션 시작
    ├── Reservation 테이블에 새 레코드 INSERT
    └── 선택된 Seat들의 status를 'reserved'로 UPDATE
    ↓
트랜잭션 커밋 → 예약 번호 생성 및 반환
```

### **5. 예약 조회 플로우**
```
Reservation 테이블에서 검색 (예약번호 OR 연락처)
    ↓
Concert, Schedule 테이블과 JOIN
    ↓
예약 목록 반환 (콘서트명, 관람일시, 예약상태, 좌석정보)
```

### **6. 예약 취소 플로우**
```
Reservation 테이블에서 예약 정보 조회
    ↓
취소 가능 여부 검증 (공연 시간, 예약 상태)
    ↓
트랜잭션 시작
    ├── Reservation 테이블 UPDATE (status='cancelled', cancelledAt=현재시간)
    └── 관련 Seat들의 status를 'available'로 UPDATE
    ↓
트랜잭션 커밋
```

---

## 🗄️ **데이터베이스 스키마**

### **테이블 구조**

#### **1. concerts (콘서트)**
```sql
CREATE TABLE concerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    poster_image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_concerts_created_at ON concerts(created_at);

-- 코멘트
COMMENT ON TABLE concerts IS '콘서트 기본 정보';
COMMENT ON COLUMN concerts.title IS '콘서트 제목';
COMMENT ON COLUMN concerts.description IS '콘서트 설명';
COMMENT ON COLUMN concerts.poster_image_url IS '포스터 이미지 URL';
```

#### **2. schedules (공연 일정)**
```sql
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    concert_id UUID NOT NULL REFERENCES concerts(id) ON DELETE CASCADE,
    date_time TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_schedules_concert_id ON schedules(concert_id);
CREATE INDEX idx_schedules_date_time ON schedules(date_time);
CREATE INDEX idx_schedules_concert_date ON schedules(concert_id, date_time);

-- 코멘트
COMMENT ON TABLE schedules IS '콘서트 공연 일정';
COMMENT ON COLUMN schedules.concert_id IS '콘서트 ID (외래키)';
COMMENT ON COLUMN schedules.date_time IS '공연 날짜 및 시간';
```

#### **3. seats (좌석)**
```sql
CREATE TABLE seats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE CASCADE,
    seat_number VARCHAR(10) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    price INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'reserved')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_seats_schedule_id ON seats(schedule_id);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_schedule_status ON seats(schedule_id, status);
CREATE UNIQUE INDEX idx_seats_schedule_seat_unique ON seats(schedule_id, seat_number);

-- 코멘트
COMMENT ON TABLE seats IS '좌석 정보';
COMMENT ON COLUMN seats.schedule_id IS '공연 일정 ID (외래키)';
COMMENT ON COLUMN seats.seat_number IS '좌석 번호 (예: A10, B05)';
COMMENT ON COLUMN seats.grade IS '좌석 등급 (R, S, A 등)';
COMMENT ON COLUMN seats.price IS '좌석 가격';
COMMENT ON COLUMN seats.status IS '좌석 상태 (available: 예약가능, reserved: 예약됨)';
```

#### **4. reservations (예약)**
```sql
CREATE TABLE reservations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id UUID NOT NULL REFERENCES schedules(id) ON DELETE RESTRICT,
    seat_ids UUID[] NOT NULL,
    total_price INTEGER NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    cancelled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스
CREATE INDEX idx_reservations_schedule_id ON reservations(schedule_id);
CREATE INDEX idx_reservations_customer_phone ON reservations(customer_phone);
CREATE INDEX idx_reservations_customer_email ON reservations(customer_email);
CREATE INDEX idx_reservations_status ON reservations(status);
CREATE INDEX idx_reservations_created_at ON reservations(created_at);

-- 코멘트
COMMENT ON TABLE reservations IS '예약 정보';
COMMENT ON COLUMN reservations.schedule_id IS '공연 일정 ID (외래키)';
COMMENT ON COLUMN reservations.seat_ids IS '예약된 좌석 ID 배열';
COMMENT ON COLUMN reservations.total_price IS '총 결제 금액';
COMMENT ON COLUMN reservations.customer_name IS '예약자 이름';
COMMENT ON COLUMN reservations.customer_phone IS '예약자 휴대폰 번호';
COMMENT ON COLUMN reservations.customer_email IS '예약자 이메일 (선택사항)';
COMMENT ON COLUMN reservations.status IS '예약 상태 (confirmed: 확정, cancelled: 취소)';
COMMENT ON COLUMN reservations.cancelled_at IS '취소 시간';
```

---

## 🔄 **트리거 및 함수**

### **updated_at 자동 업데이트 트리거**
```sql
-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 각 테이블에 트리거 적용
CREATE TRIGGER update_concerts_updated_at BEFORE UPDATE ON concerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_seats_updated_at BEFORE UPDATE ON seats
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reservations_updated_at BEFORE UPDATE ON reservations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 📝 **주요 쿼리 패턴**

### **1. 콘서트 목록 조회 (예매 가능한 콘서트만)**
```sql
SELECT DISTINCT c.id, c.title, c.poster_image_url
FROM concerts c
INNER JOIN schedules s ON c.id = s.concert_id
WHERE s.date_time > NOW()
ORDER BY c.created_at DESC;
```

### **2. 특정 콘서트의 예매 가능한 날짜 조회**
```sql
SELECT DISTINCT DATE(s.date_time) as available_date
FROM schedules s
WHERE s.concert_id = $1 
  AND s.date_time > NOW()
ORDER BY available_date;
```

### **3. 특정 날짜의 회차 조회 (잔여 좌석 수 포함)**
```sql
SELECT 
    s.id,
    s.date_time,
    COUNT(CASE WHEN st.status = 'available' THEN 1 END) as available_seats
FROM schedules s
LEFT JOIN seats st ON s.id = st.schedule_id
WHERE s.concert_id = $1 
  AND DATE(s.date_time) = $2
  AND s.date_time > NOW()
GROUP BY s.id, s.date_time
ORDER BY s.date_time;
```

### **4. 좌석 배치도 조회**
```sql
SELECT id, seat_number, grade, price, status
FROM seats
WHERE schedule_id = $1
ORDER BY seat_number;
```

### **5. 예약 생성 (트랜잭션)**
```sql
BEGIN;

-- 좌석 상태 재확인
SELECT id FROM seats 
WHERE id = ANY($1::UUID[]) 
  AND status = 'available'
FOR UPDATE;

-- 예약 생성
INSERT INTO reservations (
    schedule_id, seat_ids, total_price, 
    customer_name, customer_phone, customer_email
) VALUES ($1, $2, $3, $4, $5, $6)
RETURNING id;

-- 좌석 상태 업데이트
UPDATE seats 
SET status = 'reserved', updated_at = NOW()
WHERE id = ANY($2::UUID[]);

COMMIT;
```

### **6. 예약 조회 (예약번호 또는 연락처)**
```sql
SELECT 
    r.id,
    c.title as concert_title,
    s.date_time,
    r.customer_name,
    r.total_price,
    r.status,
    r.created_at
FROM reservations r
INNER JOIN schedules s ON r.schedule_id = s.id
INNER JOIN concerts c ON s.concert_id = c.id
WHERE (r.id::text = $1 OR r.customer_phone = $2 OR r.customer_email = $3)
ORDER BY r.created_at DESC;
```

### **7. 예약 취소 (트랜잭션)**
```sql
BEGIN;

-- 예약 상태 업데이트
UPDATE reservations 
SET status = 'cancelled', 
    cancelled_at = NOW(), 
    updated_at = NOW()
WHERE id = $1 
  AND status = 'confirmed'
RETURNING seat_ids;

-- 좌석 상태 복원
UPDATE seats 
SET status = 'available', updated_at = NOW()
WHERE id = ANY((SELECT seat_ids FROM reservations WHERE id = $1));

COMMIT;
```

---

## 🔒 **데이터 무결성 및 제약조건**

### **1. 외래키 제약조건**
- `schedules.concert_id` → `concerts.id` (CASCADE DELETE)
- `seats.schedule_id` → `schedules.id` (CASCADE DELETE)
- `reservations.schedule_id` → `schedules.id` (RESTRICT DELETE)

### **2. 체크 제약조건**
- `seats.status`: 'available' 또는 'reserved'만 허용
- `reservations.status`: 'confirmed' 또는 'cancelled'만 허용

### **3. 유니크 제약조건**
- `seats(schedule_id, seat_number)`: 동일 회차 내 좌석 번호 중복 방지

### **4. 필수 필드**
- 모든 테이블의 기본 정보 필드는 NOT NULL
- `reservations.customer_email`은 선택사항 (NULL 허용)

---

## 🚀 **성능 최적화**

### **1. 인덱스 전략**
- **복합 인덱스**: 자주 함께 조회되는 컬럼들 (concert_id + date_time, schedule_id + status)
- **단일 인덱스**: 검색 조건으로 사용되는 컬럼들 (customer_phone, customer_email)
- **시간 기반 인덱스**: 날짜/시간 범위 검색을 위한 date_time 인덱스

### **2. 쿼리 최적화**
- JOIN 최소화를 위한 적절한 정규화
- 좌석 상태 조회 시 필요한 컬럼만 SELECT
- 페이지네이션을 위한 LIMIT/OFFSET 활용

### **3. 동시성 제어**
- 좌석 예약 시 `SELECT ... FOR UPDATE` 사용
- Redis를 통한 좌석 락(Lock) 관리
- 트랜잭션 격리 수준 적절히 설정

---

## 📊 **샘플 데이터**

### **콘서트 샘플**
```sql
INSERT INTO concerts (title, description, poster_image_url) VALUES
('아이유 콘서트 2024', '아이유의 특별한 콘서트', 'https://picsum.photos/seed/iu-concert/400/600'),
('BTS 월드 투어', 'BTS 글로벌 투어 서울 공연', 'https://picsum.photos/seed/bts-tour/400/600');
```

### **일정 샘플**
```sql
INSERT INTO schedules (concert_id, date_time) VALUES
((SELECT id FROM concerts WHERE title = '아이유 콘서트 2024'), '2024-12-25 19:00:00+09'),
((SELECT id FROM concerts WHERE title = '아이유 콘서트 2024'), '2024-12-26 19:00:00+09');
```

### **좌석 샘플**
```sql
INSERT INTO seats (schedule_id, seat_number, grade, price) VALUES
((SELECT id FROM schedules LIMIT 1), 'A01', 'R', 150000),
((SELECT id FROM schedules LIMIT 1), 'A02', 'R', 150000),
((SELECT id FROM schedules LIMIT 1), 'B01', 'S', 120000);
```

---

## 🔧 **Redis 캐시 전략**

### **1. 좌석 락(Lock) 관리**
```
Key: seat_lock:{seat_id}
Value: {user_session_id}
TTL: 300초 (5분)
```

### **2. 좌석 상태 캐시**
```
Key: seat_status:{schedule_id}
Value: JSON 형태의 좌석 상태 맵
TTL: 60초
```

### **3. 콘서트 목록 캐시**
```
Key: concert_list
Value: JSON 형태의 콘서트 목록
TTL: 300초 (5분)
```

---

## 📈 **모니터링 및 유지보수**

### **1. 성능 모니터링**
- 자주 실행되는 쿼리의 실행 계획 모니터링
- 인덱스 사용률 및 테이블 스캔 빈도 체크
- 동시 접속자 수 대비 응답 시간 모니터링

### **2. 데이터 정리**
- 과거 공연 데이터의 아카이빙 전략
- 취소된 예약의 주기적 정리
- 로그 테이블 파티셔닝 고려

### **3. 백업 및 복구**
- 일일 전체 백업
- 트랜잭션 로그 백업
- 포인트 인 타임 복구 전략

이 데이터베이스 설계는 PRD와 유저플로우에 명시된 모든 기능을 지원하며, 90초 목표 달성을 위한 성능 최적화와 실시간 좌석 동기화를 위한 구조를 제공합니다.
