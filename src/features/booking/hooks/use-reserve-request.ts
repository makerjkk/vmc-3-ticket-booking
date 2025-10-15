import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useBookingCompletionContext } from '../context/booking-completion-context';
import { apiClient } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';

export const useReserveRequest = () => {
  const router = useRouter();
  const { state, reservationActions, modalActions } = useBookingCompletionContext();
  const { toast } = useToast();

  const handleReserve = useCallback(
    (scheduleId: string, seatIds: string[], totalPrice: number) => {
      // 예약 요청 시작
      reservationActions.startSubmitting();

      apiClient
        .post('/api/booking/reserve', {
          scheduleId,
          seatIds,
          customerName: state.form.customerName,
          customerPhone: state.form.phoneNumber,
          customerEmail: state.form.email || undefined,
          totalPrice,
        })
        .then((response) => {
          if (response.data.ok) {
            // 예약 성공
            const reservationId = response.data.data.reservationId;
            reservationActions.submitSuccess(reservationId);

            // 완료 페이지로 이동
            router.push(`/booking/success?reservationId=${reservationId}`);
          } else {
            // 예약 실패
            const errorCode = response.data.error.code;
            const errorMessage = response.data.error.message;

            reservationActions.submitFailure(errorCode, errorMessage);

            // 동시성 충돌 처리
            if (errorCode === 'SEATS_NOT_AVAILABLE') {
              toast({
                title: '좌석 예약 불가',
                description:
                  '선택하신 좌석이 이미 예약되었습니다. 다른 좌석을 선택해주세요',
                variant: 'destructive',
              });

              // 모달 닫기
              modalActions.closeModal();
            } else if (errorCode === 'DUPLICATE_RESERVATION') {
              toast({
                title: '중복 예약',
                description: '이미 해당 공연에 대한 예약이 존재합니다',
                variant: 'destructive',
              });
            } else {
              toast({
                title: '예약 실패',
                description: errorMessage,
                variant: 'destructive',
              });
            }
          }
        })
        .catch((error) => {
          console.error('Reservation error:', error);
          // 네트워크 오류
          reservationActions.showRetry();

          toast({
            title: '네트워크 오류',
            description: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요',
            variant: 'destructive',
          });
        });
    },
    [state.form, reservationActions, modalActions, router, toast]
  );

  const handleRetry = useCallback(
    (scheduleId: string, seatIds: string[], totalPrice: number) => {
      // 재시도
      handleReserve(scheduleId, seatIds, totalPrice);
    },
    [handleReserve]
  );

  return {
    handleReserve,
    handleRetry,
    isSubmitting: state.ui.isSubmitting,
    showRetryButton: state.ui.showRetryButton,
    apiError: state.error.apiError,
  };
};

