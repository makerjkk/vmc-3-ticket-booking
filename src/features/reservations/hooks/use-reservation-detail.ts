'use client';

import { useCallback } from 'react';
import { apiClient } from '@/lib/remote/api-client';
import type { ReservationDetailResponse } from '../lib/dto';
import { ERROR_MESSAGES } from '../constants/detail';

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export const useReservationDetailApi = () => {
  const fetchReservationDetail = useCallback(
    async (reservationId: string): Promise<ReservationDetailResponse> => {
      const response = await apiClient.get<ApiResponse<ReservationDetailResponse>>(
        `/api/reservations/${reservationId}`
      );

      if (!response.data?.ok || !response.data.data) {
        const errorMessage = response.data?.error?.message || ERROR_MESSAGES.FETCH_FAILED;
        throw new Error(errorMessage);
      }

      return response.data.data;
    },
    []
  );

  return { fetchReservationDetail };
};

