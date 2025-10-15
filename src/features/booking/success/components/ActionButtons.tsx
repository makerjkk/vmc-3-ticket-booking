'use client';

import { Button } from '@/components/ui/button';
import { useBookingSuccess } from '../hooks/useBookingSuccess';

/**
 * 액션 버튼들
 */
export function ActionButtons() {
  const { isNavigating, handleNavigateToReservations, handleNavigateToHome } =
    useBookingSuccess();

  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
      <Button
        onClick={handleNavigateToReservations}
        disabled={isNavigating}
        variant="default"
        size="lg"
        className="w-full sm:w-auto"
      >
        예약 조회하기
      </Button>
      <Button
        onClick={handleNavigateToHome}
        disabled={isNavigating}
        variant="outline"
        size="lg"
        className="w-full sm:w-auto"
      >
        메인으로 돌아가기
      </Button>
    </div>
  );
}

