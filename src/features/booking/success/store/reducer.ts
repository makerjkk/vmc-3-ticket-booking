import type { BookingSuccessState } from '../types/state';
import type { BookingSuccessAction } from '../types/actions';
import { ActionTypes } from '../types/actions';
import { initialState } from './initial-state';

/**
 * Booking Success Reducer (순수 함수)
 */
export function bookingSuccessReducer(
  state: BookingSuccessState,
  action: BookingSuccessAction
): BookingSuccessState {
  switch (action.type) {
    case ActionTypes.FETCH_RESERVATION_START:
      return {
        ...state,
        loadingState: 'loading',
        error: null,
      };

    case ActionTypes.FETCH_RESERVATION_SUCCESS:
      return {
        ...state,
        loadingState: 'success',
        isRetrying: false,
        reservationData: action.payload,
        error: null,
      };

    case ActionTypes.FETCH_RESERVATION_ERROR:
      return {
        ...state,
        loadingState: 'error',
        isRetrying: false,
        error: action.payload,
      };

    case ActionTypes.RETRY_FETCH:
      return {
        ...state,
        loadingState: 'loading',
        isRetrying: true,
        error: null,
      };

    case ActionTypes.TOGGLE_PRICE_DETAIL:
      return {
        ...state,
        isPriceDetailExpanded: !state.isPriceDetailExpanded,
      };

    case ActionTypes.NAVIGATE_START:
      return {
        ...state,
        isNavigating: true,
      };

    case ActionTypes.RESET_STATE:
      return initialState;

    default:
      return state;
  }
}

