import { useReducer } from 'react';
import type { ReservationDetailResponse } from '../lib/dto';

export type ReservationDetailState = {
  reservation: ReservationDetailResponse | null;
  canCancel: boolean;
  cancelReason: string | null;
  isLoading: boolean;
  error: string | null;
  showCancelDialog: boolean;
  isCancelling: boolean;
  cancelSuccess: boolean;
};

export type ReservationDetailAction =
  | { type: 'FETCH_RESERVATION_START' }
  | {
      type: 'FETCH_RESERVATION_SUCCESS';
      payload: {
        reservation: ReservationDetailResponse;
        canCancel: boolean;
        cancelReason: string | null;
      };
    }
  | { type: 'FETCH_RESERVATION_FAILURE'; payload: string }
  | { type: 'SHOW_CANCEL_DIALOG' }
  | { type: 'HIDE_CANCEL_DIALOG' }
  | { type: 'CANCEL_RESERVATION_START' }
  | { type: 'CANCEL_RESERVATION_SUCCESS'; payload: ReservationDetailResponse }
  | { type: 'CANCEL_RESERVATION_FAILURE'; payload: string }
  | { type: 'RESET_CANCEL_SUCCESS' }
  | { type: 'RESET_STATE' };

export const initialState: ReservationDetailState = {
  reservation: null,
  canCancel: false,
  cancelReason: null,
  isLoading: true,
  error: null,
  showCancelDialog: false,
  isCancelling: false,
  cancelSuccess: false,
};

function reservationDetailReducer(
  state: ReservationDetailState,
  action: ReservationDetailAction
): ReservationDetailState {
  switch (action.type) {
    case 'FETCH_RESERVATION_START':
      return {
        ...initialState,
        isLoading: true,
        error: null,
      };

    case 'FETCH_RESERVATION_SUCCESS':
      return {
        ...state,
        isLoading: false,
        error: null,
        reservation: action.payload.reservation,
        canCancel: action.payload.canCancel,
        cancelReason: action.payload.cancelReason,
      };

    case 'FETCH_RESERVATION_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        reservation: null,
      };

    case 'SHOW_CANCEL_DIALOG':
      return {
        ...state,
        showCancelDialog: true,
      };

    case 'HIDE_CANCEL_DIALOG':
      return {
        ...state,
        showCancelDialog: false,
      };

    case 'CANCEL_RESERVATION_START':
      return {
        ...state,
        isCancelling: true,
        error: null,
      };

    case 'CANCEL_RESERVATION_SUCCESS':
      return {
        ...state,
        isCancelling: false,
        cancelSuccess: true,
        showCancelDialog: false,
        reservation: action.payload,
        canCancel: false,
        cancelReason: '이미 취소된 예약입니다',
      };

    case 'CANCEL_RESERVATION_FAILURE':
      return {
        ...state,
        isCancelling: false,
        error: action.payload,
      };

    case 'RESET_CANCEL_SUCCESS':
      return {
        ...state,
        cancelSuccess: false,
      };

    case 'RESET_STATE':
      return initialState;

    default:
      return state;
  }
}

export const useReservationDetailReducer = () => {
  return useReducer(reservationDetailReducer, initialState);
};

