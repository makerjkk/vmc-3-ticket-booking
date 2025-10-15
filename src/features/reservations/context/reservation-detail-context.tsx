'use client';

import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { useReservationDetailReducer } from '../hooks/use-reservation-detail-reducer';
import type { ReservationDetailState } from '../hooks/use-reservation-detail-reducer';
import { useReservationDetailApi } from '../hooks/use-reservation-detail';
import { useReservationCancelApi } from '../hooks/use-reservation-cancel';
import { validateCancellation } from '../lib/cancel-validator';
import {
  formatScheduleDateTime,
  formatPrice,
  formatSeats,
  formatCancelledAt,
  formatSeatsSummary,
} from '../lib/formatters';

type ReservationDetailContextType = {
  state: ReservationDetailState;
  actions: {
    openCancelDialog: () => void;
    closeCancelDialog: () => void;
    cancelReservation: () => Promise<void>;
    retry: () => void;
  };
  derived: {
    isCancelled: boolean;
    isConfirmed: boolean;
    showCancelButton: boolean;
    isCancelButtonDisabled: boolean;
    showSuccessToast: boolean;
    formattedData: {
      concertDateTime: string | null;
      totalSeats: string | null;
      seatNumbers: string | null;
      totalPriceFormatted: string | null;
      reservationStatusText: string | null;
      cancelledAt: string | null;
      seatsSummary: string | null;
    };
  };
};

const ReservationDetailContext = createContext<ReservationDetailContextType | undefined>(
  undefined
);

export const ReservationDetailProvider: React.FC<{
  children: React.ReactNode;
  reservationId: string;
}> = ({ children, reservationId }) => {
  const [state, dispatch] = useReservationDetailReducer();
  const { fetchReservationDetail } = useReservationDetailApi();
  const { cancelReservation: cancelReservationApi } = useReservationCancelApi();

  const fetchReservation = useCallback(() => {
    dispatch({ type: 'FETCH_RESERVATION_START' });

    fetchReservationDetail(reservationId)
      .then((reservation) => {
        const validation = validateCancellation(
          reservation.status,
          reservation.scheduleDateTime
        );

        dispatch({
          type: 'FETCH_RESERVATION_SUCCESS',
          payload: {
            reservation,
            canCancel: validation.canCancel,
            cancelReason: validation.reason,
          },
        });
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : '예약 정보를 불러오는 중 오류가 발생했습니다';
        dispatch({ type: 'FETCH_RESERVATION_FAILURE', payload: errorMessage });
      });
  }, [reservationId, fetchReservationDetail]);

  useEffect(() => {
    fetchReservation();
  }, [fetchReservation]);

  useEffect(() => {
    if (state.cancelSuccess) {
      const timer = setTimeout(() => {
        dispatch({ type: 'RESET_CANCEL_SUCCESS' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.cancelSuccess]);

  const openCancelDialog = useCallback(() => {
    dispatch({ type: 'SHOW_CANCEL_DIALOG' });
  }, []);

  const closeCancelDialog = useCallback(() => {
    dispatch({ type: 'HIDE_CANCEL_DIALOG' });
  }, []);

  const cancelReservation = useCallback(() => {
    dispatch({ type: 'CANCEL_RESERVATION_START' });

    return cancelReservationApi(reservationId)
      .then(() => {
        return fetchReservationDetail(reservationId);
      })
      .then((updatedReservation) => {
        dispatch({
          type: 'CANCEL_RESERVATION_SUCCESS',
          payload: updatedReservation,
        });
      })
      .catch((error) => {
        const errorMessage =
          error instanceof Error ? error.message : '예약 취소 중 오류가 발생했습니다';
        dispatch({ type: 'CANCEL_RESERVATION_FAILURE', payload: errorMessage });
      });
  }, [reservationId, cancelReservationApi, fetchReservationDetail]);

  const retry = useCallback(() => {
    fetchReservation();
  }, [fetchReservation]);

  const derived = useMemo(() => {
    const reservation = state.reservation;

    return {
      isCancelled: reservation?.status === 'cancelled',
      isConfirmed: reservation?.status === 'confirmed',
      showCancelButton: state.canCancel && !state.isCancelling,
      isCancelButtonDisabled: !state.canCancel || state.isCancelling,
      showSuccessToast: state.cancelSuccess,
      formattedData: {
        concertDateTime: reservation ? formatScheduleDateTime(reservation.scheduleDateTime) : null,
        totalSeats: reservation ? `${reservation.seatCount}석` : null,
        seatNumbers: reservation ? formatSeats(reservation.seats) : null,
        totalPriceFormatted: reservation ? formatPrice(reservation.totalPrice) : null,
        reservationStatusText: reservation?.status === 'confirmed' ? '예약 확정' : '예약 취소됨',
        cancelledAt: reservation?.cancelledAt ? formatCancelledAt(reservation.cancelledAt) : null,
        seatsSummary: reservation ? formatSeatsSummary(reservation.seats) : null,
      },
    };
  }, [state.reservation, state.canCancel, state.isCancelling, state.cancelSuccess]);

  const value = useMemo(
    () => ({
      state,
      actions: {
        openCancelDialog,
        closeCancelDialog,
        cancelReservation,
        retry,
      },
      derived,
    }),
    [state, openCancelDialog, closeCancelDialog, cancelReservation, retry, derived]
  );

  return (
    <ReservationDetailContext.Provider value={value}>
      {children}
    </ReservationDetailContext.Provider>
  );
};

export const useReservationDetailContext = () => {
  const context = useContext(ReservationDetailContext);
  if (!context) {
    throw new Error('useReservationDetailContext must be used within ReservationDetailProvider');
  }
  return context;
};

