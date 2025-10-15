-- ================================================
-- Migration: 예약 취소 RPC 함수
-- Description: 트랜잭션 기반 예약 취소 함수
-- ================================================

-- 예약 취소 RPC 함수 생성
CREATE OR REPLACE FUNCTION cancel_reservation_rpc(
  p_reservation_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_reservation RECORD;
  v_schedule_datetime TIMESTAMPTZ;
  v_time_until_concert INTERVAL;
BEGIN
  -- 1. 예약 정보 조회 및 락 획득
  SELECT r.*, s.date_time
  INTO v_reservation
  FROM reservations r
  INNER JOIN schedules s ON r.schedule_id = s.id
  WHERE r.id = p_reservation_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'RESERVATION_NOT_FOUND'
      USING HINT = 'The specified reservation does not exist';
  END IF;
  
  -- 2. 이미 취소된 예약 확인
  IF v_reservation.status = 'cancelled' THEN
    RAISE EXCEPTION 'ALREADY_CANCELLED'
      USING HINT = 'This reservation has already been cancelled';
  END IF;
  
  -- 3. 취소 가능 여부 검증 (공연 시작 2시간 전까지)
  v_time_until_concert := v_reservation.date_time - NOW();
  
  IF v_time_until_concert < INTERVAL '2 hours' THEN
    RAISE EXCEPTION 'CANNOT_CANCEL_TOO_CLOSE'
      USING HINT = 'Cannot cancel within 2 hours of concert start';
  END IF;
  
  -- 4. 예약 상태 업데이트
  UPDATE reservations
  SET status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
  WHERE id = p_reservation_id;
  
  -- 5. 좌석 상태 복원
  UPDATE seats
  SET status = 'available',
      updated_at = NOW()
  WHERE id = ANY(v_reservation.seat_ids);
  
  -- 6. 결과 반환
  RETURN json_build_object(
    'reservation_id', p_reservation_id,
    'cancelled_at', NOW(),
    'success', true
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

-- 권한 부여
GRANT EXECUTE ON FUNCTION cancel_reservation_rpc TO authenticated, anon;

-- 코멘트
COMMENT ON FUNCTION cancel_reservation_rpc IS '예약 취소 RPC 함수 (트랜잭션 기반)';

