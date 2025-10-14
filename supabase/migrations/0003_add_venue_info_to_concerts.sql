-- Migration: Add venue information to concerts table
-- 콘서트 테이블에 공연장 정보 추가

-- 공연장 정보 컬럼 추가
ALTER TABLE public.concerts 
ADD COLUMN IF NOT EXISTS venue_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS venue_address TEXT;

-- 컬럼 코멘트 추가
COMMENT ON COLUMN public.concerts.venue_name IS '공연장 이름';
COMMENT ON COLUMN public.concerts.venue_address IS '공연장 주소';

-- 기존 콘서트 데이터에 샘플 공연장 정보 업데이트
UPDATE public.concerts 
SET 
  venue_name = CASE 
    WHEN title LIKE '%아이유%' THEN '서울 용산구 남산타워 스카이라운지'
    WHEN title LIKE '%BTS%' THEN '서울 송파구 올림픽공원 체조경기장'
    WHEN title LIKE '%뉴진스%' THEN '서울 강남구 코엑스 오디토리움'
    ELSE '서울 마포구 홍대 라이브홀'
  END,
  venue_address = CASE 
    WHEN title LIKE '%아이유%' THEN '서울특별시 용산구 남산공원길 105'
    WHEN title LIKE '%BTS%' THEN '서울특별시 송파구 올림픽로 424'
    WHEN title LIKE '%뉴진스%' THEN '서울특별시 강남구 영동대로 513'
    ELSE '서울특별시 마포구 와우산로 94'
  END
WHERE venue_name IS NULL;
