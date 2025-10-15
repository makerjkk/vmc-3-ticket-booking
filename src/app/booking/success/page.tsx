'use client';

import { BookingSuccessProvider } from '@/features/booking/success/context/BookingSuccessProvider';
import { LoadingView } from '@/features/booking/success/components/LoadingView';
import { ErrorView } from '@/features/booking/success/components/ErrorView';
import { ReservationInfoCard } from '@/features/booking/success/components/ReservationInfoCard';
import { useBookingSuccess } from '@/features/booking/success/hooks/useBookingSuccess';

/**
 * 예약 완료 페이지 컨텐츠
 */
function BookingSuccessContent() {
  const { isLoading, hasError } = useBookingSuccess();

  if (isLoading) {
    return <LoadingView />;
  }

  if (hasError) {
    return <ErrorView />;
  }

  return <ReservationInfoCard />;
}

/**
 * 예약 완료 페이지
 */
export default function BookingSuccessPage() {
  return (
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#ffffff' }}
    >
      <BookingSuccessProvider>
        <BookingSuccessContent />
      </BookingSuccessProvider>
    </div>
  );
}
