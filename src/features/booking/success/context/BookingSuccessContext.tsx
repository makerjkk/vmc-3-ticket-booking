'use client';

import { createContext } from 'react';
import type { ReservationDetail, ErrorInfo } from '../types/state';

/**
 * Context Value 인터페이스
 */
export interface BookingSuccessContextValue {
  // State (6개)
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  isRetrying: boolean;
  reservationData: ReservationDetail | null;
  error: ErrorInfo | null;
  isPriceDetailExpanded: boolean;
  isNavigating: boolean;

  // Actions (4개)
  handleRetry: () => void;
  handleTogglePriceDetail: () => void;
  handleNavigateToReservations: () => void;
  handleNavigateToHome: () => void;

  // Derived (6개)
  isLoading: boolean;
  hasError: boolean;
  isSuccess: boolean;
  showRetryButton: boolean;
  isCancelled: boolean;
  hasEmail: boolean;
}

/**
 * Context 생성
 */
export const BookingSuccessContext = createContext<
  BookingSuccessContextValue | undefined
>(undefined);

