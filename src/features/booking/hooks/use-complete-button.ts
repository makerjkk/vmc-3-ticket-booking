import { useCallback } from 'react';
import { useBookingCompletionContext } from '../context/booking-completion-context';
import { apiClient } from '@/lib/remote/api-client';
import { useToast } from '@/hooks/use-toast';

export const useCompleteButton = () => {
  const { state, validationActions, modalActions } = useBookingCompletionContext();
  const { toast } = useToast();

  const handleCompleteSelection = useCallback(
    (scheduleId: string, seatIds: string[]) => {
      if (seatIds.length === 0) {
        toast({
          title: '좌석 선택 필요',
          description: '최소 1개 이상의 좌석을 선택해주세요',
          variant: 'destructive',
        });
        return;
      }

      // 좌석 검증 시작
      validationActions.startValidating();

      apiClient
        .post('/api/booking/validate-seats', {
          scheduleId,
          seatIds,
        })
        .then((response) => {
          // 응답 구조 확인
          if (!response.data || typeof response.data !== 'object') {
            throw new Error('Invalid response format');
          }

          if (response.data.ok && response.data.data?.valid) {
            // 검증 성공 → 모달 열기
            validationActions.validationSuccess();
          } else {
            // 검증 실패 → 에러 표시
            const invalidSeats = response.data.data?.invalidSeats || [];
            validationActions.validationFailure(
              invalidSeats.length > 0
                ? '선택하신 좌석이 이미 예약되었습니다'
                : '좌석 검증에 실패했습니다'
            );

            toast({
              title: '좌석 선택 실패',
              description: '선택하신 좌석이 이미 예약되었습니다. 다시 선택해주세요',
              variant: 'destructive',
            });
          }
        })
        .catch((error) => {
          console.error('Validation error:', error);
          validationActions.validationFailure('네트워크 오류가 발생했습니다');
          toast({
            title: '연결 오류',
            description: '네트워크 오류가 발생했습니다. 다시 시도해주세요',
            variant: 'destructive',
          });
        });
    },
    [validationActions, toast]
  );

  return {
    handleCompleteSelection,
    isValidating: state.ui.isValidating,
    validationError: state.error.validationError,
  };
};
