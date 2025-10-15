-- ================================================
-- 예약 및 좌석 상태 초기화
-- ================================================
-- 이 마이그레이션은 모든 예약 데이터를 삭제하고
-- 모든 좌석의 상태를 'available'로 초기화합니다.
-- 
-- 주의: 이 작업은 되돌릴 수 없습니다!
-- 프로덕션 환경에서는 절대 실행하지 마세요.
-- ================================================

BEGIN;

-- 1. 모든 예약 삭제
DELETE FROM reservations;

-- 2. 모든 좌석 상태를 'available'로 초기화
UPDATE seats
SET status = 'available',
    updated_at = NOW();

-- 3. 확인 (선택 사항)
-- SELECT '예약 삭제 완료' as message, COUNT(*) as remaining_reservations FROM reservations;
-- SELECT '좌석 초기화 완료' as message, COUNT(*) as available_seats FROM seats WHERE status = 'available';

COMMIT;
