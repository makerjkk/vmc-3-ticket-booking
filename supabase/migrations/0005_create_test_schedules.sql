-- Migration: Create test schedules with future dates
-- 테스트용 미래 날짜 스케줄 생성

-- 기존 스케줄 삭제 (테스트용)
DELETE FROM public.seats WHERE schedule_id IN (
  SELECT s.id FROM public.schedules s
  INNER JOIN public.concerts c ON s.concert_id = c.id
  WHERE c.title = '뉴진스 팬미팅'
);

DELETE FROM public.schedules WHERE concert_id IN (
  SELECT id FROM public.concerts WHERE title = '뉴진스 팬미팅'
);

-- 뉴진스 팬미팅 새 스케줄 생성 (현재 날짜 + 7일, 14일, 21일)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  generate_series(
    (CURRENT_DATE + INTERVAL '7 days')::date + TIME '18:00:00',
    (CURRENT_DATE + INTERVAL '21 days')::date + TIME '18:00:00',
    INTERVAL '7 days'
  ) AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅';

-- 뉴진스 팬미팅 추가 회차 (같은 날 다른 시간)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '7 days')::date + TIME '15:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅';

INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '14 days')::date + TIME '15:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅';

-- 새로 생성된 모든 스케줄에 좌석 생성
DO $$
DECLARE
    schedule_rec RECORD;
    seat_grades TEXT[] := ARRAY['R', 'S', 'A'];
    seat_prices INTEGER[] := ARRAY[150000, 120000, 90000];
    grade_idx INTEGER;
    seat_num INTEGER;
    row_names TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E'];
    row_idx INTEGER;
BEGIN
    -- 뉴진스 팬미팅 스케줄에 대해 좌석 생성
    FOR schedule_rec IN 
        SELECT s.id 
        FROM public.schedules s
        INNER JOIN public.concerts c ON s.concert_id = c.id
        WHERE c.title = '뉴진스 팬미팅'
          AND s.date_time > NOW()
    LOOP
        -- 각 등급별로 좌석 생성
        FOR grade_idx IN 1..3 LOOP
            -- 각 등급당 5개 행, 행당 10개 좌석 생성
            FOR row_idx IN 1..5 LOOP
                FOR seat_num IN 1..10 LOOP
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
