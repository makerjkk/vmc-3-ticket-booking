-- Migration: Update concert schedules with specific times
-- 콘서트 스케줄을 요청된 시간으로 업데이트

-- 기존 모든 스케줄과 좌석 삭제 (새로 생성하기 위해)
DELETE FROM public.seats WHERE schedule_id IN (
  SELECT s.id FROM public.schedules s
  INNER JOIN public.concerts c ON s.concert_id = c.id
  WHERE c.title IN ('뉴진스 팬미팅', 'BTS 월드 투어 서울', '아이유 콘서트 2024')
);

DELETE FROM public.schedules WHERE concert_id IN (
  SELECT id FROM public.concerts 
  WHERE title IN ('뉴진스 팬미팅', 'BTS 월드 투어 서울', '아이유 콘서트 2024')
);

-- 뉴진스 팬미팅: 오후 4시~5시 (16:00~17:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '7 days')::date + TIME '16:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅';

INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '14 days')::date + TIME '16:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅';

INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '21 days')::date + TIME '16:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '뉴진스 팬미팅';

-- BTS 월드 투어 서울: 27일 1회차 10시~12시 (10:00~12:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '27 days')::date + TIME '10:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = 'BTS 월드 투어 서울';

-- BTS 월드 투어 서울: 27일 2회차 오후 16시~18시 (16:00~18:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '27 days')::date + TIME '16:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = 'BTS 월드 투어 서울';

-- BTS 월드 투어 서울: 28일 1회차 10시~12시 (10:00~12:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '28 days')::date + TIME '10:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = 'BTS 월드 투어 서울';

-- 아이유 콘서트 2024: 13일 오후 19시~21시 (19:00~21:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '13 days')::date + TIME '19:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '아이유 콘서트 2024';

-- 아이유 콘서트 2024: 20일 오후 19시~21시 (19:00~21:00)
INSERT INTO public.schedules (concert_id, date_time)
SELECT 
  c.id,
  (CURRENT_DATE + INTERVAL '20 days')::date + TIME '19:00:00' AT TIME ZONE 'Asia/Seoul'
FROM public.concerts c
WHERE c.title = '아이유 콘서트 2024';

-- 새로 생성된 모든 스케줄에 좌석 생성
DO $$
DECLARE
    schedule_rec RECORD;
    concert_rec RECORD;
    seat_grades TEXT[] := ARRAY['R', 'S', 'A'];
    seat_prices INTEGER[] := ARRAY[150000, 120000, 90000];
    grade_idx INTEGER;
    seat_num INTEGER;
    row_names TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    row_idx INTEGER;
    seats_per_row INTEGER;
    total_rows INTEGER;
BEGIN
    -- 각 콘서트별로 다른 좌석 구성
    FOR concert_rec IN 
        SELECT id, title FROM public.concerts 
        WHERE title IN ('뉴진스 팬미팅', 'BTS 월드 투어 서울', '아이유 콘서트 2024')
    LOOP
        -- 콘서트별 좌석 설정
        IF concert_rec.title = '뉴진스 팬미팅' THEN
            seats_per_row := 8;  -- 작은 규모
            total_rows := 5;
        ELSIF concert_rec.title = 'BTS 월드 투어 서울' THEN
            seats_per_row := 15; -- 대형 공연장
            total_rows := 8;
        ELSE -- 아이유 콘서트 2024
            seats_per_row := 12; -- 중간 규모
            total_rows := 6;
        END IF;

        -- 해당 콘서트의 모든 스케줄에 좌석 생성
        FOR schedule_rec IN 
            SELECT s.id 
            FROM public.schedules s
            WHERE s.concert_id = concert_rec.id
              AND s.date_time > NOW()
        LOOP
            -- 각 등급별로 좌석 생성
            FOR grade_idx IN 1..3 LOOP
                -- 각 등급당 지정된 행 수만큼 좌석 생성
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
    END LOOP;
END $$;
