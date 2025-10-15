'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/remote/api-client';
import type { CancelReservationResponse } from '../lib/dto';
import { ERROR_MESSAGES } from '../constants/detail';

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export const useReservationCancelApi = () => {
  const cancelReservation = useCallback(
    async (reservationId: string): Promise<CancelReservationResponse> => {
      const response = await apiClient.delete<ApiResponse<CancelReservationResponse>>(
        `/api/reservations/${reservationId}`
      );

      if (!response.data?.ok || !response.data.data) {
        const errorMessage = response.data?.error?.message || ERROR_MESSAGES.CANCEL_FAILED;
        throw new Error(errorMessage);
      }

      return response.data.data;
    },
    []
  );

  return { cancelReservation };
};

