import { differenceInMinutes, isPast } from 'date-fns';
import { CANCEL_THRESHOLD_MINUTES, CANCEL_REASON_MESSAGES } from '../constants/detail';

export type CancelValidationResult = {
  canCancel: boolean;
  reason: string | null;
};

/**
 * 예약 취소 가능 여부 검증
 */
export const validateCancellation = (
  status: 'confirmed' | 'cancelled',
  scheduleDateTime: string
): CancelValidationResult => {
  // 1. 이미 취소된 예약
  if (status === 'cancelled') {
    return {
      canCancel: false,
      reason: CANCEL_REASON_MESSAGES.ALREADY_CANCELLED,
    };
  }

  const concertDate = new Date(scheduleDateTime);

  // 2. 이미 지난 공연
  if (isPast(concertDate)) {
    return {
      canCancel: false,
      reason: CANCEL_REASON_MESSAGES.PAST_EVENT,
    };
  }

  // 3. 공연 시작 2시간 이내
  const minutesUntilConcert = differenceInMinutes(concertDate, new Date());
  if (minutesUntilConcert < CANCEL_THRESHOLD_MINUTES) {
    return {
      canCancel: false,
      reason: CANCEL_REASON_MESSAGES.TOO_CLOSE_TO_CONCERT,
    };
  }

  // 취소 가능
  return {
    canCancel: true,
    reason: null,
  };
};

