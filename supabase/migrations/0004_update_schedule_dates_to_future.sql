-- Migration: Update schedule dates to future dates
-- 스케줄 날짜를 미래 날짜로 업데이트

-- 현재 날짜 기준으로 미래 날짜로 업데이트
UPDATE public.schedules 
SET date_time = CASE 
  WHEN c.title = '아이유 콘서트 2024' AND s.date_time::date = '2024-12-25' 
    THEN (CURRENT_DATE + INTERVAL '30 days')::date + TIME '19:00:00' AT TIME ZONE 'Asia/Seoul'
  WHEN c.title = '아이유 콘서트 2024' AND s.date_time::date = '2024-12-26'
    THEN (CURRENT_DATE + INTERVAL '31 days')::date + TIME '19:00:00' AT TIME ZONE 'Asia/Seoul'
  WHEN c.title = 'BTS 월드 투어 서울'
    THEN (CURRENT_DATE + INTERVAL '45 days')::date + TIME '20:00:00' AT TIME ZONE 'Asia/Seoul'
  WHEN c.title = '뉴진스 팬미팅'
    THEN (CURRENT_DATE + INTERVAL '60 days')::date + TIME '18:00:00' AT TIME ZONE 'Asia/Seoul'
  ELSE s.date_time
END,
updated_at = NOW()
FROM public.schedules s
INNER JOIN public.concerts c ON s.concert_id = c.id
WHERE public.schedules.id = s.id
  AND c.title IN ('아이유 콘서트 2024', 'BTS 월드 투어 서울', '뉴진스 팬미팅');

-- 뉴진스 팬미팅에 추가 회차 생성 (다음날)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '61 days')::date + TIME '15:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅'
  AND NOT EXISTS (
    SELECT 1 FROM public.schedules s2 
    WHERE s2.concert_id = c.id 
      AND s2.date_time::date = (CURRENT_DATE + INTERVAL '61 days')::date
  );

-- BTS 월드 투어에 추가 회차 생성
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '46 days')::date + TIME '15:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = 'BTS 월드 투어 서울'
  AND NOT EXISTS (
    SELECT 1 FROM public.schedules s2 
    WHERE s2.concert_id = c.id 
      AND s2.date_time::date = (CURRENT_DATE + INTERVAL '46 days')::date
  );

-- 새로 생성된 스케줄에 대한 좌석 생성
DO $$
DECLARE
    schedule_rec RECORD;
    seat_grades TEXT[] := ARRAY['R', 'S', 'A'];
    seat_prices INTEGER[] := ARRAY[150000, 120000, 90000];
    grade_idx INTEGER;
    seat_num INTEGER;
BEGIN
    -- 좌석이 없는 스케줄에 대해 좌석 생성
    FOR schedule_rec IN 
        SELECT s.id 
        FROM public.schedules s
        LEFT JOIN public.seats st ON s.id = st.schedule_id
        WHERE st.schedule_id IS NULL
    LOOP
        -- 각 등급별로 좌석 생성
        FOR grade_idx IN 1..3 LOOP
            -- 각 등급당 20개 좌석 생성
            FOR seat_num IN 1..20 LOOP
                INSERT INTO public.seats (schedule_id, seat_number, grade, price, status)
                VALUES (
                    schedule_rec.id,
                    seat_grades[grade_idx] || LPAD(seat_num::TEXT, 2, '0'),
                    seat_grades[grade_idx],
                    seat_prices[grade_idx],
                    'available'
                )
                ON CONFLICT DO NOTHING;
            END LOOP;
        END LOOP;
    END LOOP;
END $$;
