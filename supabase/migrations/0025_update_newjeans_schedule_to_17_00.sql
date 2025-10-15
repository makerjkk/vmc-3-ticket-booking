-- Migration: Update NewJeans Fan Meeting schedules to 17:00 KST (UTC 08:00)
-- 뉴진스 팬미팅의 모든 공연 회차를 오후 5시(17:00)로 변경

BEGIN;

-- 뉴진스 팬미팅 시간을 UTC 08:00으로 변경 (= KST 17:00)
UPDATE public.schedules
SET 
  date_time = DATE_TRUNC('day', date_time) + INTERVAL '8 hours',
  updated_at = NOW()
WHERE concert_id = (
  SELECT id 
  FROM public.concerts 
  WHERE title = '뉴진스 팬미팅'
);

COMMIT;

-- ================================================
-- 업데이트 결과 확인 (KST 기준으로 표시)
-- ================================================
DO $$
DECLARE
  updated_count INTEGER;
  schedule_info RECORD;
BEGIN
  -- 업데이트된 스케줄 개수 확인
  SELECT COUNT(*) INTO updated_count
  FROM public.schedules s
  INNER JOIN public.concerts c ON s.concert_id = c.id
  WHERE c.title = '뉴진스 팬미팅';
  
  RAISE NOTICE '뉴진스 팬미팅 스케줄 업데이트 완료: % 개 회차', updated_count;
  
  -- 각 스케줄의 업데이트된 시간 출력 (KST 기준)
  FOR schedule_info IN 
    SELECT 
      s.id,
      s.date_time,
      TO_CHAR(s.date_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as formatted_time_kst,
      EXTRACT(HOUR FROM s.date_time AT TIME ZONE 'Asia/Seoul') as hour_kst
    FROM public.schedules s
    INNER JOIN public.concerts c ON s.concert_id = c.id
    WHERE c.title = '뉴진스 팬미팅'
    ORDER BY s.date_time
  LOOP
    RAISE NOTICE '  - 스케줄 ID: %, KST 공연 시간: %, 시간: %시', 
                 schedule_info.id, 
                 schedule_info.formatted_time_kst, 
                 schedule_info.hour_kst;
  END LOOP;
  
  -- 17시가 아닌 스케줄이 있는지 확인
  IF EXISTS (
    SELECT 1 
    FROM public.schedules s
    INNER JOIN public.concerts c ON s.concert_id = c.id
    WHERE c.title = '뉴진스 팬미팅'
      AND EXTRACT(HOUR FROM s.date_time AT TIME ZONE 'Asia/Seoul') != 17
  ) THEN
    RAISE WARNING '⚠️  17시가 아닌 스케줄이 존재합니다!';
  ELSE
    RAISE NOTICE '✅  모든 스케줄이 17시(KST)로 정상 업데이트되었습니다.';
  END IF;
END $$;

-- 최종 확인 쿼리
SELECT 
  c.title as "콘서트명",
  TO_CHAR(s.date_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as "공연시간_KST",
  EXTRACT(HOUR FROM s.date_time AT TIME ZONE 'Asia/Seoul') as "시간_KST",
  s.date_time as "UTC_시간"
FROM public.schedules s
INNER JOIN public.concerts c ON s.concert_id = c.id
WHERE c.title = '뉴진스 팬미팅'
ORDER BY s.date_time;

