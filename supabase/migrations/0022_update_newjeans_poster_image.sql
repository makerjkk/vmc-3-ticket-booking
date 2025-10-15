-- ================================================
-- Migration: 뉴진스 팬미팅 포스터 이미지 업데이트
-- ================================================
-- 뉴진스 팬미팅 콘서트의 포스터 이미지를 실제 이미지로 변경

BEGIN;

-- 뉴진스 팬미팅 포스터 이미지 업데이트
UPDATE public.concerts
SET 
  poster_image_url = 'https://cdn.bandinews.com/news/photo/202407/252_592_5652.jpg',
  updated_at = NOW()
WHERE title = '뉴진스 팬미팅';

-- 결과 확인
DO $$
DECLARE
  concert_info RECORD;
BEGIN
  SELECT 
    id,
    title,
    poster_image_url,
    updated_at
  INTO concert_info
  FROM public.concerts
  WHERE title = '뉴진스 팬미팅';
  
  IF FOUND THEN
    RAISE NOTICE '✓ 뉴진스 팬미팅 포스터 이미지 업데이트 완료';
    RAISE NOTICE '  - 제목: %', concert_info.title;
    RAISE NOTICE '  - 이미지 URL: %', concert_info.poster_image_url;
    RAISE NOTICE '  - 업데이트 시간: %', concert_info.updated_at;
  ELSE
    RAISE NOTICE '⚠ 뉴진스 팬미팅을 찾을 수 없습니다';
  END IF;
END $$;

COMMIT;

-- ================================================
-- 검증 쿼리 (확인용)
-- ================================================
/*
SELECT 
  title,
  poster_image_url,
  description,
  updated_at
FROM public.concerts
WHERE title = '뉴진스 팬미팅';
*/

