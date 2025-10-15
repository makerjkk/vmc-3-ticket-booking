-- Migration: Update NewJeans concert to 02nd 19:00
-- 뉴진스 콘서트를 02일 19시로 수정

-- 뉴진스 콘서트의 기존 스케줄과 좌석 삭제
DELETE FROM public.seats WHERE schedule_id IN (
  SELECT s.id FROM public.schedules s
  INNER JOIN public.concerts c ON s.concert_id = c.id
  WHERE c.title IN ('뉴진스 팬미팅', '뉴진스 콘서트')
);

DELETE FROM public.schedules WHERE concert_id IN (
  SELECT id FROM public.concerts WHERE title IN ('뉴진스 팬미팅', '뉴진스 콘서트')
);

-- 뉴진스 콘서트 새 스케줄 생성
-- 02일 19시 (19:00~21:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month' + INTERVAL '1 day')::date + TIME '19:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title IN ('뉴진스 팬미팅', '뉴진스 콘서트');

-- 새로 생성된 뉴진스 콘서트 스케줄에 좌석 생성
DO $$
DECLARE
    schedule_rec RECORD;
    seat_grades TEXT[] := ARRAY['R', 'S', 'A'];
    seat_prices INTEGER[] := ARRAY[150000, 120000, 90000];
    grade_idx INTEGER;
    seat_num INTEGER;
    row_names TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F'];
    row_idx INTEGER;
    seats_per_row INTEGER := 10;  -- 콘서트 규모
    total_rows INTEGER := 6;
BEGIN
    -- 뉴진스 콘서트 스케줄에 대해 좌석 생성
    FOR schedule_rec IN 
        SELECT s.id 
        FROM public.schedules s
        INNER JOIN public.concerts c ON s.concert_id = c.id
        WHERE c.title IN ('뉴진스 팬미팅', '뉴진스 콘서트')
          AND s.date_time > NOW()
    LOOP
        -- 각 등급별로 좌석 생성
        FOR grade_idx IN 1..3 LOOP
            -- 각 등급당 6개 행, 행당 10개 좌석 생성
            FOR row_idx IN 1..total_rows LOOP
                FOR seat_num IN 1..seats_per_row LOOP
                    INSERT INTO public.seats (schedule_id, seat_number, grade, price, status)
                    VALUES (
                        schedule_rec.id,
                        seat_grades[grade_idx] || row_names[row_idx] || LPAD(seat_num::TEXT, 2, '0'),
                        seat_grades[grade_idx],
                        seat_prices[grade_idx],
                        'available'
                    );
                END LOOP;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
