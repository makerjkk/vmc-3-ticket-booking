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
      const response = await apiClient.delete<CancelReservationResponse>(
        `/api/reservations/${reservationId}`
      );

      // 백엔드 respond() 함수는 성공 시 data를 직접 반환
      // axios 응답 구조: response.data = { reservationId, reservationNumber, status, ... }
      if (!response.data || !response.data.reservationId) {
        throw new Error(ERROR_MESSAGES.CANCEL_FAILED);
      }

      return response.data;
    },
    []
  );

  return { cancelReservation };
};

