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
    <div 
      className="container mx-auto px-4 py-8 sm:py-12 max-w-3xl"
      style={{ backgroundColor: '#ffffff' }}
    >
      <SuccessHeader />

      <Card 
        className="mb-6 shadow-lg"
        style={{ 
          backgroundColor: '#ffffff',
          borderColor: '#e2e8f0'
        }}
      >
        <CardContent className="p-6 sm:p-8">
          {isCancelled && (
            <div 
              className="rounded-lg p-5 mb-6 border-2"
              style={{
                backgroundColor: '#fef2f2',
                borderColor: '#fecaca'
              }}
            >
              <p 
                className="font-bold text-base sm:text-lg"
                style={{ color: '#991b1b' }}
              >
                이 예약은 취소되었습니다
              </p>
              {reservationData.cancelledAt && (
                <p 
                  className="text-sm sm:text-base mt-2"
                  style={{ color: '#dc2626' }}
                >
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

