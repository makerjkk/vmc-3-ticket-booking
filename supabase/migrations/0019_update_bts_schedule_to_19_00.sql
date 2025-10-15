-- ================================================
-- Migration: BTS 월드 투어 서울 공연 시간을 19:00으로 통일
-- ================================================
-- BTS 콘서트의 모든 공연 회차를 저녁 7시(19:00)로 변경

BEGIN;

-- BTS 콘서트 ID 조회 및 스케줄 업데이트
UPDATE public.schedules
SET 
  date_time = DATE_TRUNC('day', date_time) + INTERVAL '19 hours',
  updated_at = NOW()
WHERE concert_id = (
  SELECT id 
  FROM public.concerts 
  WHERE title = 'BTS 월드 투어 서울'
  LIMIT 1
);

-- 업데이트 결과 확인
DO $$
DECLARE
  updated_count INTEGER;
  schedule_info RECORD;
BEGIN
  -- 업데이트된 스케줄 개수 확인
  SELECT COUNT(*) INTO updated_count
  FROM public.schedules s
  INNER JOIN public.concerts c ON s.concert_id = c.id
  WHERE c.title = 'BTS 월드 투어 서울';
  
  RAISE NOTICE 'BTS 콘서트 스케줄 업데이트 완료: % 개 회차', updated_count;
  
  -- 각 스케줄의 업데이트된 시간 출력
  FOR schedule_info IN 
    SELECT 
      s.id,
      s.date_time,
      TO_CHAR(s.date_time, 'YYYY-MM-DD HH24:MI:SS') as formatted_time
    FROM public.schedules s
    INNER JOIN public.concerts c ON s.concert_id = c.id
    WHERE c.title = 'BTS 월드 투어 서울'
    ORDER BY s.date_time
  LOOP
    RAISE NOTICE '  - 스케줄 ID: %, 공연 시간: %', schedule_info.id, schedule_info.formatted_time;
  END LOOP;
END $$;

COMMIT;

-- ================================================
-- 검증 쿼리 (확인용 - 실행 안 됨)
-- ================================================
-- SELECT 
--   c.title as concert_title,
--   s.date_time,
--   TO_CHAR(s.date_time, 'YYYY-MM-DD HH24:MI:SS') as formatted_time,
--   EXTRACT(HOUR FROM s.date_time) as hour
-- FROM public.schedules s
-- INNER JOIN public.concerts c ON s.concert_id = c.id
-- WHERE c.title = 'BTS 월드 투어 서울'
-- ORDER BY s.date_time;

