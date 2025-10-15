-- Migration: Redesign seat layout to match real concert hall
-- 실제 공연장처럼 좌석 배치 재설계
-- 총 286석 (11행 x 26열)
-- A석(프리미엄): 중앙 앞쪽, S석(스탠다드): A석 주변, R석(이코노미): 가장자리

BEGIN;

-- 1. 기존 좌석 데이터 모두 삭제
DELETE FROM public.seats;

-- 2. 좌석 배치 함수 생성
CREATE OR REPLACE FUNCTION create_realistic_seats(p_schedule_id UUID)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  v_row TEXT;
  v_col INTEGER;
  v_seat_number TEXT;
  v_grade TEXT;
  v_price INTEGER;
BEGIN
  -- 11개 행 (A~K) x 26개 열 (1~26) = 286석
  
  FOR v_row IN SELECT unnest(ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K'])
  LOOP
    FOR v_col IN 1..26
    LOOP
      v_seat_number := v_row || v_col;
      
      -- 좌석 등급 및 가격 결정 로직
      -- A석 (프리미엄): 중앙 앞쪽 황금 영역 (C-E행, 9-18열) - 30석
      -- S석 (스탠다드): A석 주변 + G행 중앙 (B-G행, 6-21열) - A석 제외 - 66석
      -- R석 (이코노미): 나머지 모든 영역 - 190석
      
      IF v_row IN ('C', 'D', 'E') AND v_col BETWEEN 9 AND 18 THEN
        -- A석 (프리미엄): 중앙 앞쪽 3행 x 10열 = 30석
        v_grade := 'A';
        v_price := 150000;
        
      ELSIF v_row IN ('B', 'C', 'D', 'E', 'F', 'G') AND v_col BETWEEN 6 AND 21 THEN
        -- S석 (스탠다드): A석 주변 영역 (A석 제외)
        -- B행: 6-21열 = 16석
        -- C-E행: 6-8열, 19-21열 = 3행 x 6열 = 18석
        -- F행: 6-21열 = 16석
        -- G행: 6-21열 = 16석
        -- 총 66석
        v_grade := 'S';
        v_price := 120000;
        
      ELSE
        -- R석 (이코노미): 나머지 모든 영역
        -- A행: 1-26 = 26석
        -- B행: 1-5, 22-26 = 10석
        -- C-E행: 1-5, 22-26 = 3행 x 10열 = 30석
        -- F행: 1-5, 22-26 = 10석
        -- G행: 1-5, 22-26 = 10석
        -- H-K행: 1-26 = 4행 x 26열 = 104석
        -- 총 190석
        v_grade := 'R';
        v_price := 90000;
      END IF;
      
      -- 좌석 삽입
      INSERT INTO public.seats (
        schedule_id,
        seat_number,
        grade,
        price,
        status,
        row_name,
        seat_index
      ) VALUES (
        p_schedule_id,
        v_seat_number,
        v_grade,
        v_price,
        'available',
        v_row,
        v_col
      );
    END LOOP;
  END LOOP;
END;
$$;

-- 3. 모든 기존 스케줄에 대해 새로운 좌석 배치 생성
DO $$
DECLARE
  v_schedule_id UUID;
BEGIN
  FOR v_schedule_id IN SELECT id FROM public.schedules
  LOOP
    PERFORM create_realistic_seats(v_schedule_id);
  END LOOP;
END;
$$;

-- 4. 함수 삭제 (일회성 사용)
DROP FUNCTION IF EXISTS create_realistic_seats(UUID);

-- 5. 통계 출력을 위한 뷰 생성
CREATE OR REPLACE VIEW seat_statistics AS
SELECT 
  s.id as schedule_id,
  c.title as concert_title,
  s.date_time,
  COUNT(*) as total_seats,
  COUNT(*) FILTER (WHERE seats.grade = 'A') as a_seats,
  COUNT(*) FILTER (WHERE seats.grade = 'S') as s_seats,
  COUNT(*) FILTER (WHERE seats.grade = 'R') as r_seats,
  COUNT(*) FILTER (WHERE seats.status = 'available') as available_seats,
  COUNT(*) FILTER (WHERE seats.status = 'reserved') as reserved_seats
FROM public.schedules s
JOIN public.concerts c ON s.concert_id = c.id
JOIN public.seats seats ON s.id = seats.schedule_id
GROUP BY s.id, c.title, s.date_time
ORDER BY s.date_time;

COMMENT ON VIEW seat_statistics IS '스케줄별 좌석 통계 뷰';

COMMIT;

