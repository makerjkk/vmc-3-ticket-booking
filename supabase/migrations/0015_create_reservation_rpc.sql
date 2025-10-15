-- ================================================
-- Migration: 예약 생성 RPC 함수
-- Description: 트랜잭션 기반 예약 생성 함수 (좌석 락 및 상태 업데이트 포함)
-- ================================================

-- 예약 생성 RPC 함수 (트랜잭션)
CREATE OR REPLACE FUNCTION create_reservation_with_seats(
  p_schedule_id UUID,
  p_seat_ids UUID[],
  p_customer_name VARCHAR(100),
  p_customer_phone VARCHAR(20),
  p_customer_email VARCHAR(255),
  p_total_price INTEGER
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_reservation_id UUID;
  v_available_count INTEGER;
  v_concert_id UUID;
  v_reservation_number VARCHAR(20);
BEGIN
  -- 1. schedule_id로부터 concert_id 조회
  SELECT concert_id
  INTO v_concert_id
  FROM schedules
  WHERE id = p_schedule_id;
  
  IF v_concert_id IS NULL THEN
    RAISE EXCEPTION 'SCHEDULE_NOT_FOUND'
      USING HINT = 'The specified schedule does not exist';
  END IF;
  
  -- 2. 좌석 상태 확인 및 락 획득
  -- FOR UPDATE는 aggregate 함수와 함께 사용할 수 없으므로 서브쿼리 사용
  WITH locked_seats AS (
    SELECT id
    FROM seats
    WHERE id = ANY(p_seat_ids)
      AND schedule_id = p_schedule_id
      AND status = 'available'
    FOR UPDATE
  )
  SELECT COUNT(*)
  INTO v_available_count
  FROM locked_seats;
  
  -- 3. 모든 좌석이 예약 가능한지 확인
  IF v_available_count != array_length(p_seat_ids, 1) THEN
    RAISE EXCEPTION 'SEATS_NOT_AVAILABLE'
      USING HINT = 'One or more seats are not available';
  END IF;
  
  -- 4. 예약 번호 생성 (R + YYMMDD + 일련번호 4자리)
  SELECT 'R' || to_char(NOW(), 'YYMMDD') || lpad((COUNT(*) + 1)::text, 4, '0')
  INTO v_reservation_number
  FROM reservations
  WHERE reservation_number LIKE 'R' || to_char(NOW(), 'YYMMDD') || '%';
  
  -- 5. 예약 레코드 생성
  INSERT INTO reservations (
    concert_id,
    schedule_id,
    seat_ids,
    total_price,
    customer_name,
    customer_phone,
    customer_email,
    reservation_number,
    status,
    created_at,
    updated_at
  )
  VALUES (
    v_concert_id,
    p_schedule_id,
    p_seat_ids,
    p_total_price,
    p_customer_name,
    p_customer_phone,
    CASE WHEN p_customer_email = '' THEN NULL ELSE p_customer_email END,
    v_reservation_number,
    'confirmed',
    NOW(),
    NOW()
  )
  RETURNING id INTO v_reservation_id;
  
  -- 6. 좌석 상태 업데이트
  UPDATE seats
  SET status = 'reserved', updated_at = NOW()
  WHERE id = ANY(p_seat_ids);
  
  -- 7. 결과 반환
  RETURN json_build_object(
    'reservation_id', v_reservation_id,
    'reservation_number', v_reservation_number,
    'success', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    -- 에러 발생 시 롤백
    RAISE;
END;
$$;

-- 함수 실행 권한 부여
GRANT EXECUTE ON FUNCTION create_reservation_with_seats TO authenticated, anon;

-- 코멘트
COMMENT ON FUNCTION create_reservation_with_seats IS '트랜잭션 기반 예약 생성 함수 (좌석 락 및 상태 업데이트 포함)';

