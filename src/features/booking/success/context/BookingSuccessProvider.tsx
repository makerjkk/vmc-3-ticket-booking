'use client';

import React, { useReducer, useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { bookingSuccessReducer, initialState } from '../store';
import { ActionTypes } from '../types/actions';
import { apiClient } from '@/lib/remote/api-client';
import { mapApiErrorToErrorInfo } from '../lib/error-mapper';
import { BookingSuccessContext } from './BookingSuccessContext';

/**
 * Provider Props
 */
interface BookingSuccessProviderProps {
  children: React.ReactNode;
}

/**
 * Booking Success Provider
 */
export function BookingSuccessProvider({ children }: BookingSuccessProviderProps) {
  const [state, dispatch] = useReducer(bookingSuccessReducer, initialState);
  const router = useRouter();
  const searchParams = useSearchParams();

  const reservationId = searchParams.get('reservationId');

  const fetchReservation = useCallback((id: string, isRetry = false) => {
    if (isRetry) {
      dispatch({ type: ActionTypes.RETRY_FETCH });
    } else {
      dispatch({ type: ActionTypes.FETCH_RESERVATION_START });
    }

    apiClient
      .get(`/api/reservations/${id}`)
      .then((response) => {
        console.log('[예약 완료 페이지] API 응답:', response);
        console.log('[예약 완료 페이지] response.data:', response.data);
        
        // 백엔드 respond 함수는 성공 시 data만 반환
        // 성공: { reservationId: 'xxx', reservationNumber: 'yyy', ... }
        // 실패: { error: { code: 'xxx', message: 'yyy' } }
        
        if (response.data && response.data.reservationId) {
          console.log('[예약 완료 페이지] 예약 정보 조회 성공');
          dispatch({
            type: ActionTypes.FETCH_RESERVATION_SUCCESS,
            payload: response.data,
          });
        } else if (response.data && response.data.error) {
          console.log('[예약 완료 페이지] API 에러 응답:', response.data.error);
          const error = mapApiErrorToErrorInfo('NOT_FOUND');
          dispatch({ type: ActionTypes.FETCH_RESERVATION_ERROR, payload: error });
        } else {
          console.error('[예약 완료 페이지] 예상치 못한 응답 구조:', response.data);
          const error = mapApiErrorToErrorInfo('NOT_FOUND');
          dispatch({ type: ActionTypes.FETCH_RESERVATION_ERROR, payload: error });
        }
      })
      .catch((err) => {
        console.error('[예약 완료 페이지] API 에러:', err);
        const statusCode = err?.response?.status;
        const error = mapApiErrorToErrorInfo(statusCode);
        dispatch({ type: ActionTypes.FETCH_RESERVATION_ERROR, payload: error });
      });
  }, []);

  useEffect(() => {
    if (!reservationId) {
      const error = mapApiErrorToErrorInfo('MISSING_ID');
      dispatch({ type: ActionTypes.FETCH_RESERVATION_ERROR, payload: error });
      return;
    }

    fetchReservation(reservationId);
  }, [reservationId, fetchReservation]);

  const handleRetry = useCallback(() => {
    if (reservationId) {
      fetchReservation(reservationId, true);
    }
  }, [reservationId, fetchReservation]);

  const handleTogglePriceDetail = useCallback(() => {
    dispatch({ type: ActionTypes.TOGGLE_PRICE_DETAIL });
  }, []);

  const handleNavigateToReservations = useCallback(() => {
    dispatch({ type: ActionTypes.NAVIGATE_START, payload: '/reservations' });
    router.push('/reservations');
  }, [router]);

  const handleNavigateToHome = useCallback(() => {
    dispatch({ type: ActionTypes.NAVIGATE_START, payload: '/' });
    router.push('/');
  }, [router]);

  const isLoading = useMemo(
    () => state.loadingState === 'loading' || state.isRetrying,
    [state.loadingState, state.isRetrying]
  );

  const hasError = useMemo(
    () => state.loadingState === 'error' && state.error !== null,
    [state.loadingState, state.error]
  );

  const isSuccess = useMemo(
    () => state.loadingState === 'success' && state.reservationData !== null,
    [state.loadingState, state.reservationData]
  );

  const showRetryButton = useMemo(
    () => hasError && state.error?.retryable === true,
    [hasError, state.error]
  );

  const isCancelled = useMemo(
    () => state.reservationData?.status === 'cancelled',
    [state.reservationData]
  );

  const hasEmail = useMemo(
    () => state.reservationData?.customerEmail != null && state.reservationData?.customerEmail !== '',
    [state.reservationData]
  );

  const contextValue = useMemo(
    () => ({
      loadingState: state.loadingState,
      isRetrying: state.isRetrying,
      reservationData: state.reservationData,
      error: state.error,
      isPriceDetailExpanded: state.isPriceDetailExpanded,
      isNavigating: state.isNavigating,
      handleRetry,
      handleTogglePriceDetail,
      handleNavigateToReservations,
      handleNavigateToHome,
      isLoading,
      hasError,
      isSuccess,
      showRetryButton,
      isCancelled,
      hasEmail,
    }),
    [
      state,
      handleRetry,
      handleTogglePriceDetail,
      handleNavigateToReservations,
      handleNavigateToHome,
      isLoading,
      hasError,
      isSuccess,
      showRetryButton,
      isCancelled,
      hasEmail,
    ]
  );

  return (
    <BookingSuccessContext.Provider value={contextValue}>
      {children}
    </BookingSuccessContext.Provider>
  );
}

