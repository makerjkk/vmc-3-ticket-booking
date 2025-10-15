-- Migration: Update NewJeans fanmeeting to concert
-- 뉴진스 팬미팅을 콘서트로 변경

-- 뉴진스 콘서트 정보 업데이트
UPDATE public.concerts 
SET 
  title = '뉴진스 콘서트',
  description = '뉴진스와 함께하는 특별한 콘서트 시간입니다.',
  updated_at = NOW()
WHERE title = '뉴진스 팬미팅';

-- 만약 이미 '뉴진스 콘서트'로 변경되어 있다면 설명만 업데이트
UPDATE public.concerts 
SET 
  description = '뉴진스와 함께하는 특별한 콘서트 시간입니다.',
  updated_at = NOW()
WHERE title = '뉴진스 콘서트' AND description != '뉴진스와 함께하는 특별한 콘서트 시간입니다.';
