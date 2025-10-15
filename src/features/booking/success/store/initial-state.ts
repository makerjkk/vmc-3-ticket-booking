import type { BookingSuccessState } from '../types/state';

/**
 * 초기 상태
 */
export const initialState: BookingSuccessState = {
  loadingState: 'idle',
  isRetrying: false,
  reservationData: null,
  error: null,
  isPriceDetailExpanded: false,
  isNavigating: false,
};

