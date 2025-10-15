-- Migration: Update IU concert from 2024 to 2025
-- 아이유 콘서트를 2024에서 2025로 업데이트

-- 아이유 콘서트 제목 업데이트
UPDATE public.concerts 
SET 
  title = '아이유 콘서트 2025',
  updated_at = NOW()
WHERE title = '아이유 콘서트 2024';

-- 업데이트 결과 확인을 위한 로그
DO $$
DECLARE
    updated_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO updated_count 
    FROM public.concerts 
    WHERE title = '아이유 콘서트 2025';
    
    RAISE NOTICE '아이유 콘서트 업데이트 완료: % 개 레코드', updated_count;
END $$;
