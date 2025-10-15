'use client';

import { Card, CardContent } from '@/components/ui/card';
import { useBookingSuccess } from '../hooks/useBookingSuccess';
import { SuccessHeader } from './SuccessHeader';
import { CustomerInfo } from './CustomerInfo';
import { ConcertInfo } from './ConcertInfo';
import { SeatInfo } from './SeatInfo';
import { PriceDetail } from './PriceDetail';
import { ActionButtons } from './ActionButtons';

/**
 * 예약 정보 카드 (컨테이너)
 */
export function ReservationInfoCard() {
  const { isSuccess, reservationData, isCancelled } = useBookingSuccess();

  if (!isSuccess || !reservationData) return null;

  return (
    <div className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl">
      <SuccessHeader />

      <Card className="mb-6">
        <CardContent className="p-4 sm:p-6">
          {isCancelled && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <p className="text-red-700 font-medium text-sm sm:text-base">
                이 예약은 취소되었습니다
              </p>
              {reservationData.cancelledAt && (
                <p className="text-red-600 text-xs sm:text-sm mt-1">
                  취소 일시: {new Date(reservationData.cancelledAt).toLocaleString('ko-KR')}
                </p>
              )}
            </div>
          )}

          <CustomerInfo />
          <ConcertInfo />
          <SeatInfo />
          <PriceDetail />
        </CardContent>
      </Card>

      <ActionButtons />
    </div>
  );
}

