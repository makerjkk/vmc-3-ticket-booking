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
    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
      <Button
        onClick={handleNavigateToReservations}
        disabled={isNavigating}
        size="lg"
        className="w-full sm:w-auto px-8 py-6 text-lg font-bold shadow-lg hover:shadow-xl transition-all"
        style={{
          backgroundColor: '#2563eb',
          color: '#ffffff'
        }}
      >
        예약 조회하기
      </Button>
      <Button
        onClick={handleNavigateToHome}
        disabled={isNavigating}
        variant="outline"
        size="lg"
        className="w-full sm:w-auto px-8 py-6 text-lg font-bold border-2 shadow-md hover:shadow-lg transition-all"
        style={{
          borderColor: '#cbd5e1',
          color: '#475569'
        }}
      >
        메인으로 돌아가기
      </Button>
    </div>
  );
}

