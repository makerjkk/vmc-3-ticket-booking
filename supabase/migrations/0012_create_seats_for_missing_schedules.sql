-- Migration: Create seats for schedules that don't have any seats
-- 좌석 데이터가 없는 스케줄에 대해 좌석 생성

-- 좌석이 없는 스케줄 확인 및 좌석 생성
DO $$
DECLARE
    schedule_rec RECORD;
    seat_grades TEXT[] := ARRAY['R', 'S', 'A'];
    seat_prices INTEGER[] := ARRAY[150000, 120000, 90000];
    grade_idx INTEGER;
    seat_num INTEGER;
    row_names TEXT[] := ARRAY['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
    row_idx INTEGER;
    seats_per_row INTEGER := 12;  -- 행당 좌석 수
    total_rows INTEGER := 8;      -- 총 행 수
    seats_created INTEGER := 0;
BEGIN
    -- 좌석이 없는 스케줄들을 찾아서 좌석 생성
    FOR schedule_rec IN 
        SELECT s.id, c.title
        FROM public.schedules s
        INNER JOIN public.concerts c ON s.concert_id = c.id
        LEFT JOIN public.seats st ON s.id = st.schedule_id
        WHERE st.id IS NULL  -- 좌석이 없는 스케줄
          AND s.date_time > NOW()  -- 미래 스케줄만
    LOOP
        RAISE NOTICE '좌석 생성 중: 스케줄 ID = %, 콘서트 = %', schedule_rec.id, schedule_rec.title;
        
        -- 각 등급별로 좌석 생성
        FOR grade_idx IN 1..3 LOOP
            -- 각 등급당 8개 행, 행당 12개 좌석 생성 (총 96석/등급)
            FOR row_idx IN 1..total_rows LOOP
                FOR seat_num IN 1..seats_per_row LOOP
                    INSERT INTO public.seats (
                        schedule_id, 
                        seat_number, 
                        row_name,
                        seat_index,
                        grade, 
                        price, 
                        status,
                        x_position,
                        y_position,
                        is_accessible,
                        sightline_rating
                    )
                    VALUES (
                        schedule_rec.id,
                        seat_grades[grade_idx] || row_names[row_idx] || LPAD(seat_num::TEXT, 2, '0'),
                        row_names[row_idx],
                        seat_num,
                        seat_grades[grade_idx],
                        seat_prices[grade_idx],
                        'available',
                        seat_num * 40,  -- x 좌표 (40px 간격)
                        row_idx * 40,   -- y 좌표 (40px 간격)
                        FALSE,          -- 기본적으로 휠체어 접근 불가
                        CASE 
                            WHEN seat_grades[grade_idx] = 'R' THEN 5
                            WHEN seat_grades[grade_idx] = 'S' THEN 4
                            ELSE 3
                        END             -- 등급별 시야 등급
                    );
                    
                    seats_created := seats_created + 1;
                END LOOP;
            END LOOP;
        END LOOP;
        
        RAISE NOTICE '스케줄 % 좌석 생성 완료: % 개 좌석', schedule_rec.id, (total_rows * seats_per_row * 3);
    END LOOP;
    
    RAISE NOTICE '전체 좌석 생성 완료: % 개 좌석', seats_created;
END $$;

-- 생성된 좌석 현황 확인
SELECT 
    c.title as concert_title,
    s.id as schedule_id,
    s.date_time,
    COUNT(st.id) as total_seats,
    COUNT(CASE WHEN st.status = 'available' THEN 1 END) as available_seats
FROM public.schedules s
INNER JOIN public.concerts c ON s.concert_id = c.id
LEFT JOIN public.seats st ON s.id = st.schedule_id
WHERE s.date_time > NOW()
GROUP BY c.title, s.id, s.date_time
ORDER BY s.date_time;
