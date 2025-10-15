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
        if (response.data?.ok && response.data?.data) {
          dispatch({
            type: ActionTypes.FETCH_RESERVATION_SUCCESS,
            payload: response.data.data,
          });
        } else {
          const error = mapApiErrorToErrorInfo('NOT_FOUND');
          dispatch({ type: ActionTypes.FETCH_RESERVATION_ERROR, payload: error });
        }
      })
      .catch((err) => {
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

