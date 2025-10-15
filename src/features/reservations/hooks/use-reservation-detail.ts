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
      const response = await apiClient.get<ReservationDetailResponse>(
        `/api/reservations/${reservationId}`
      );

      // 백엔드 respond() 함수는 성공 시 data를 직접 반환
      // axios 응답 구조: response.data = { reservationId, ... }
      if (!response.data || !response.data.reservationId) {
        throw new Error(ERROR_MESSAGES.FETCH_FAILED);
      }

      return response.data;
    },
    []
  );

  return { fetchReservationDetail };
};

