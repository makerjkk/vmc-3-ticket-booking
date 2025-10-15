import { useCallback } from 'react';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { SearchReservationsRequest, SearchReservationsResponse } from '../lib/dto';

type ApiResponse<T> = {
  ok: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
};

export const useReservationSearch = () => {
  const searchReservations = useCallback(async (params: SearchReservationsRequest): Promise<ApiResponse<SearchReservationsResponse>> => {
    try {
      const queryParams = new URLSearchParams();
      
      if (params.reservationId) {
        queryParams.append('reservationId', params.reservationId);
      }
      if (params.phone) {
        queryParams.append('phone', params.phone);
      }
      if (params.email) {
        queryParams.append('email', params.email);
      }
      queryParams.append('page', params.page.toString());
      queryParams.append('pageSize', params.pageSize.toString());

      const response = await apiClient.get<SearchReservationsResponse>(
        `/api/reservations/search?${queryParams.toString()}`
      );

      console.log('[검색 API] 응답:', response);

      // 백엔드 respond 함수는 성공 시 data만 반환
      // response.data = SearchReservationsResponse
      if (response.data) {
        return {
          ok: true,
          data: response.data,
        };
      } else {
        return {
          ok: false,
          error: {
            code: 'NO_DATA',
            message: '응답 데이터가 없습니다',
          },
        };
      }
    } catch (error) {
      console.error('[검색 API] 에러:', error);
      return {
        ok: false,
        error: {
          code: 'NETWORK_ERROR',
          message: extractApiErrorMessage(error, '검색 중 오류가 발생했습니다'),
        },
      };
    }
  }, []);

  return { searchReservations };
};

