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
          console.log('[예약 확정] API 응답:', response);
          
          // 응답 구조 검증
          if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response format');
          }

          console.log('[예약 확정] response.data:', response.data);

          // 백엔드 응답 구조: respond 함수는 성공 시 data만 반환
          // 성공: { reservationId: 'xxx', reservationNumber: 'yyy' }
          // 실패: { error: { code: 'xxx', message: 'yyy' } }
          
          if (response.data.reservationId) {
            // 예약 성공
            const reservationId = response.data.reservationId;
            console.log('[예약 확정] 예약 성공! reservationId:', reservationId);
            reservationActions.submitSuccess(reservationId);

            // 완료 페이지로 이동
            router.push(`/booking/success?reservationId=${reservationId}`);
          } else if (response.data.error) {
            // 예약 실패 (이 경로는 .catch에서 처리되므로 여기 도달하지 않음)
            console.log('[예약 확정] 예약 실패 응답:', response.data);
            const errorCode = response.data.error.code || 'UNKNOWN_ERROR';
            const errorMessage = response.data.error.message || '예약 처리 중 오류가 발생했습니다';

            reservationActions.submitFailure(errorCode, errorMessage);

            toast({
              title: '예약 실패',
              description: errorMessage,
              variant: 'destructive',
            });
          } else {
            // 예상치 못한 응답 구조
            console.error('[예약 확정] 예상치 못한 응답 구조:', response.data);
            throw new Error('Unexpected response format');
          }
        })
        .catch((error) => {
          console.error('Reservation error:', error);
          
          // axios 에러인 경우 응답 데이터 확인
          if (error.response?.data) {
            const errorCode = error.response.data.error?.code || 'UNKNOWN_ERROR';
            const errorMessage = error.response.data.error?.message || '예약 처리 중 오류가 발생했습니다';

            reservationActions.submitFailure(errorCode, errorMessage);

            // 에러 코드별 처리
            if (errorCode === 'SEATS_NOT_AVAILABLE') {
              toast({
                title: '좌석 예약 불가',
                description: '선택하신 좌석이 이미 예약되었습니다. 다른 좌석을 선택해주세요',
                variant: 'destructive',
              });
              modalActions.closeModal();
            } else if (errorCode === 'DUPLICATE_RESERVATION') {
              toast({
                title: '중복 예약',
                description: '이미 해당 공연에 대한 예약이 존재합니다.\n같은 전화번호로 이미 이 공연을 예약하셨습니다.',
                variant: 'destructive',
              });
              // 모달은 열린 상태로 유지 (다른 전화번호 입력 가능)
            } else {
              toast({
                title: '예약 실패',
                description: errorMessage,
                variant: 'destructive',
              });
              reservationActions.showRetry();
            }
          } else {
            // 네트워크 에러인 경우
            reservationActions.showRetry();
            toast({
              title: '네트워크 오류',
              description: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요',
              variant: 'destructive',
            });
          }
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

