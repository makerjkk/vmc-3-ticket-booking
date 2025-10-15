-- ================================================
-- Migration: BTS 콘서트 시간을 확실하게 19:00 (KST)으로 수정
-- ================================================
-- 데이터베이스에 저장된 실제 시간을 19:00 (한국 시간)으로 변경

BEGIN;

-- 1. 현재 BTS 스케줄 확인 (디버깅용)
DO $$
DECLARE
  schedule_info RECORD;
BEGIN
  RAISE NOTICE '=== 변경 전 BTS 스케줄 ===';
  FOR schedule_info IN 
    SELECT 
      s.id,
      s.date_time,
      TO_CHAR(s.date_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as kst_time
    FROM public.schedules s
    INNER JOIN public.concerts c ON s.concert_id = c.id
    WHERE c.title = 'BTS 월드 투어 서울'
    ORDER BY s.date_time
  LOOP
    RAISE NOTICE '  ID: %, Original: %, KST: %', 
      schedule_info.id, 
      schedule_info.date_time,
      schedule_info.kst_time;
  END LOOP;
END $$;

-- 2. BTS 콘서트의 모든 스케줄을 19:00 (KST)으로 업데이트
UPDATE public.schedules
SET 
  date_time = (DATE_TRUNC('day', date_time AT TIME ZONE 'Asia/Seoul') + INTERVAL '19 hours') AT TIME ZONE 'Asia/Seoul',
  updated_at = NOW()
WHERE concert_id = (
  SELECT id 
  FROM public.concerts 
  WHERE title = 'BTS 월드 투어 서울'
  LIMIT 1
);

-- 3. 변경 후 확인
DO $$
DECLARE
  schedule_info RECORD;
  updated_count INTEGER;
BEGIN
  -- 업데이트된 스케줄 개수
  SELECT COUNT(*) INTO updated_count
  FROM public.schedules s
  INNER JOIN public.concerts c ON s.concert_id = c.id
  WHERE c.title = 'BTS 월드 투어 서울';
  
  RAISE NOTICE '';
  RAISE NOTICE '=== 변경 완료: % 개 스케줄 업데이트됨 ===', updated_count;
  RAISE NOTICE '';
  
  -- 각 스케줄의 업데이트된 시간 출력
  FOR schedule_info IN 
    SELECT 
      s.id,
      s.date_time,
      TO_CHAR(s.date_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as kst_time,
      EXTRACT(HOUR FROM s.date_time AT TIME ZONE 'Asia/Seoul') as hour
    FROM public.schedules s
    INNER JOIN public.concerts c ON s.concert_id = c.id
    WHERE c.title = 'BTS 월드 투어 서울'
    ORDER BY s.date_time
  LOOP
    RAISE NOTICE '  ✓ 스케줄 ID: %, KST: % (시간: %시)', 
      schedule_info.id, 
      schedule_info.kst_time,
      schedule_info.hour;
  END LOOP;
END $$;

COMMIT;

-- ================================================
-- 검증 쿼리 (확인용)
-- ================================================
-- 아래 쿼리를 실행하여 결과 확인 가능
/*
SELECT 
  c.title as concert_title,
  s.date_time,
  TO_CHAR(s.date_time AT TIME ZONE 'Asia/Seoul', 'YYYY-MM-DD HH24:MI:SS') as kst_time,
  EXTRACT(HOUR FROM s.date_time AT TIME ZONE 'Asia/Seoul') as hour
FROM public.schedules s
INNER JOIN public.concerts c ON s.concert_id = c.id
WHERE c.title = 'BTS 월드 투어 서울'
ORDER BY s.date_time;
*/

