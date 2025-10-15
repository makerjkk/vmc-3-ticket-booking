-- Migration: Add seat layout columns to seats table
-- 좌석 배치도를 위한 컬럼들을 seats 테이블에 추가

-- 좌석 테이블에 새로운 컬럼들 추가
ALTER TABLE public.seats 
ADD COLUMN IF NOT EXISTS row_name VARCHAR(5),
ADD COLUMN IF NOT EXISTS seat_index INTEGER,
ADD COLUMN IF NOT EXISTS x_position INTEGER,
ADD COLUMN IF NOT EXISTS y_position INTEGER,
ADD COLUMN IF NOT EXISTS is_accessible BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS has_obstruction BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS sightline_rating INTEGER CHECK (sightline_rating >= 1 AND sightline_rating <= 5);

-- 기존 좌석 데이터에 대해 row_name과 seat_index 업데이트
UPDATE public.seats 
SET 
    row_name = SUBSTRING(seat_number FROM 2 FOR 1),
    seat_index = CAST(SUBSTRING(seat_number FROM 3) AS INTEGER)
WHERE row_name IS NULL OR seat_index IS NULL;

-- 좌석 위치 정보 업데이트 (기본값 설정)
UPDATE public.seats 
SET 
    x_position = COALESCE(seat_index * 40, 40),
    y_position = CASE 
        WHEN row_name = 'A' THEN 40
        WHEN row_name = 'B' THEN 80
        WHEN row_name = 'C' THEN 120
        WHEN row_name = 'D' THEN 160
        WHEN row_name = 'E' THEN 200
        WHEN row_name = 'F' THEN 240
        WHEN row_name = 'G' THEN 280
        WHEN row_name = 'H' THEN 320
        ELSE 40
    END
WHERE x_position IS NULL OR y_position IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_seats_row_seat ON public.seats(schedule_id, row_name, seat_index);

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.seats.row_name IS '좌석 행 이름 (A, B, C 등)';
COMMENT ON COLUMN public.seats.seat_index IS '행 내 좌석 번호 (1, 2, 3 등)';
COMMENT ON COLUMN public.seats.x_position IS '좌석 X 좌표 (픽셀)';
COMMENT ON COLUMN public.seats.y_position IS '좌석 Y 좌표 (픽셀)';
COMMENT ON COLUMN public.seats.is_accessible IS '휠체어 접근 가능 좌석 여부';
COMMENT ON COLUMN public.seats.has_obstruction IS '시야 방해 요소 존재 여부';
COMMENT ON COLUMN public.seats.sightline_rating IS '시야 등급 (1-5, 5가 최고)';

-- 업데이트 결과 확인
SELECT 
    c.title as concert_title,
    s.id as schedule_id,
    COUNT(st.id) as total_seats,
    COUNT(CASE WHEN st.row_name IS NOT NULL THEN 1 END) as seats_with_row,
    COUNT(CASE WHEN st.seat_index IS NOT NULL THEN 1 END) as seats_with_index
FROM public.schedules s
INNER JOIN public.concerts c ON s.concert_id = c.id
LEFT JOIN public.seats st ON s.id = st.schedule_id
WHERE s.date_time > NOW()
GROUP BY c.title, s.id
ORDER BY s.date_time;
