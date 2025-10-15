import type { ReservationDetail, ErrorInfo } from './state';

/**
 * Action Types 상수
 */
export const ActionTypes = {
  FETCH_RESERVATION_START: 'FETCH_RESERVATION_START',
  FETCH_RESERVATION_SUCCESS: 'FETCH_RESERVATION_SUCCESS',
  FETCH_RESERVATION_ERROR: 'FETCH_RESERVATION_ERROR',
  RETRY_FETCH: 'RETRY_FETCH',
  TOGGLE_PRICE_DETAIL: 'TOGGLE_PRICE_DETAIL',
  NAVIGATE_START: 'NAVIGATE_START',
  RESET_STATE: 'RESET_STATE',
} as const;

/**
 * Action Union Type
 */
export type BookingSuccessAction =
  | { type: typeof ActionTypes.FETCH_RESERVATION_START }
  | { type: typeof ActionTypes.FETCH_RESERVATION_SUCCESS; payload: ReservationDetail }
  | { type: typeof ActionTypes.FETCH_RESERVATION_ERROR; payload: ErrorInfo }
  | { type: typeof ActionTypes.RETRY_FETCH }
  | { type: typeof ActionTypes.TOGGLE_PRICE_DETAIL }
  | { type: typeof ActionTypes.NAVIGATE_START; payload: string }
  | { type: typeof ActionTypes.RESET_STATE };

