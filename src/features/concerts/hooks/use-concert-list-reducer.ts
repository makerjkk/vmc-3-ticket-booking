import { useReducer, useCallback } from 'react';
import type { ConcertItem } from '@/features/concerts/lib/dto';

// 토스트 메시지 타입
export interface ToastMessage {
  type: 'success' | 'error' | 'warning';
  message: string;
}

// 전체 상태 타입
export interface ConcertListState {
  isLoading: boolean;
  concerts: ConcertItem[];
  error: string | null;
  retryCount: number;
  selectedConcertId: string | null;
  isCheckingAvailability: boolean;
  toastMessage: ToastMessage | null;
}

// 액션 타입
export type ConcertListAction =
  | { type: 'FETCH_CONCERTS_START' }
  | { type: 'FETCH_CONCERTS_SUCCESS'; payload: ConcertItem[] }
  | { type: 'FETCH_CONCERTS_ERROR'; payload: string }
  | { type: 'RETRY_FETCH' }
  | { type: 'CHECK_AVAILABILITY_START'; payload: string }
  | { type: 'CHECK_AVAILABILITY_SUCCESS' }
  | { type: 'CHECK_AVAILABILITY_ERROR'; payload: string }
  | { type: 'SHOW_TOAST'; payload: ToastMessage }
  | { type: 'HIDE_TOAST' }
  | { type: 'RESET_ERROR' };

// 초기 상태
const initialState: ConcertListState = {
  isLoading: false,
  concerts: [],
  error: null,
  retryCount: 0,
  selectedConcertId: null,
  isCheckingAvailability: false,
  toastMessage: null,
};

// 리듀서 함수
function concertListReducer(
  state: ConcertListState,
  action: ConcertListAction
): ConcertListState {
  switch (action.type) {
    case 'FETCH_CONCERTS_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'FETCH_CONCERTS_SUCCESS':
      return {
        ...state,
        isLoading: false,
        concerts: action.payload,
        error: null,
        retryCount: 0,
      };

    case 'FETCH_CONCERTS_ERROR':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
        retryCount: state.retryCount + 1,
      };

    case 'RETRY_FETCH':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'CHECK_AVAILABILITY_START':
      return {
        ...state,
        selectedConcertId: action.payload,
        isCheckingAvailability: true,
      };

    case 'CHECK_AVAILABILITY_SUCCESS':
      return {
        ...state,
        selectedConcertId: null,
        isCheckingAvailability: false,
      };

    case 'CHECK_AVAILABILITY_ERROR':
      return {
        ...state,
        selectedConcertId: null,
        isCheckingAvailability: false,
        toastMessage: {
          type: 'warning',
          message: action.payload,
        },
      };

    case 'SHOW_TOAST':
      return {
        ...state,
        toastMessage: action.payload,
      };

    case 'HIDE_TOAST':
      return {
        ...state,
        toastMessage: null,
      };

    case 'RESET_ERROR':
      return {
        ...state,
        error: null,
        retryCount: 0,
      };

    default:
      return state;
  }
}

// 커스텀 훅
export function useConcertListReducer() {
  const [state, dispatch] = useReducer(concertListReducer, initialState);

  // Action Creators (메모이제이션으로 최적화)
  const actions = {
    fetchConcertsStart: useCallback(() => {
      dispatch({ type: 'FETCH_CONCERTS_START' });
    }, []),

    fetchConcertsSuccess: useCallback((concerts: ConcertItem[]) => {
      dispatch({ type: 'FETCH_CONCERTS_SUCCESS', payload: concerts });
    }, []),

    fetchConcertsError: useCallback((error: string) => {
      dispatch({ type: 'FETCH_CONCERTS_ERROR', payload: error });
    }, []),

    retryFetch: useCallback(() => {
      dispatch({ type: 'RETRY_FETCH' });
    }, []),

    checkAvailabilityStart: useCallback((concertId: string) => {
      dispatch({ type: 'CHECK_AVAILABILITY_START', payload: concertId });
    }, []),

    checkAvailabilitySuccess: useCallback(() => {
      dispatch({ type: 'CHECK_AVAILABILITY_SUCCESS' });
    }, []),

    checkAvailabilityError: useCallback((error: string) => {
      dispatch({ type: 'CHECK_AVAILABILITY_ERROR', payload: error });
    }, []),

    showToast: useCallback((toast: ToastMessage) => {
      dispatch({ type: 'SHOW_TOAST', payload: toast });
    }, []),

    hideToast: useCallback(() => {
      dispatch({ type: 'HIDE_TOAST' });
    }, []),

    resetError: useCallback(() => {
      dispatch({ type: 'RESET_ERROR' });
    }, []),
  };

  return { state, actions };
}
