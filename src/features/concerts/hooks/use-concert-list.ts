'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import { 
  ConcertListResponseSchema, 
  ConcertAvailabilityResponseSchema,
  type ConcertListResponse,
  type ConcertAvailabilityResponse,
} from '@/features/concerts/lib/dto';

// 콘서트 목록 조회
const fetchConcertList = async (): Promise<ConcertListResponse> => {
  try {
    const { data } = await apiClient.get('/api/concerts');
    return ConcertListResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '콘서트 목록을 불러오는데 실패했습니다');
    throw new Error(message);
  }
};

// 콘서트 예매 가능 여부 확인
const fetchConcertAvailability = async (concertId: string): Promise<ConcertAvailabilityResponse> => {
  try {
    const { data } = await apiClient.get(`/api/concerts/${concertId}/availability`);
    return ConcertAvailabilityResponseSchema.parse(data);
  } catch (error) {
    const message = extractApiErrorMessage(error, '예매 가능 여부를 확인하는데 실패했습니다');
    throw new Error(message);
  }
};

// 콘서트 목록 조회 훅
export const useConcertListQuery = () => {
  return useQuery({
    queryKey: ['concerts', 'list'],
    queryFn: fetchConcertList,
    staleTime: 5 * 60 * 1000, // 5분
    gcTime: 10 * 60 * 1000, // 10분 (이전 cacheTime)
    retry: (failureCount, error) => {
      // 최대 3회 재시도, 네트워크 오류인 경우만
      if (failureCount >= 3) return false;
      if (error.message.includes('404') || error.message.includes('400')) return false;
      return true;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000), // 지수 백오프
  });
};

// 콘서트 예매 가능 여부 확인 훅
export const useConcertAvailabilityQuery = (concertId: string, enabled = false) => {
  return useQuery({
    queryKey: ['concerts', 'availability', concertId],
    queryFn: () => fetchConcertAvailability(concertId),
    enabled: enabled && Boolean(concertId),
    staleTime: 1 * 60 * 1000, // 1분 (예매 가능 여부는 자주 변경될 수 있음)
    gcTime: 5 * 60 * 1000, // 5분
    retry: 2, // 예매 가능 여부는 빠르게 실패해야 함
  });
};

// 콘서트 목록 새로고침 훅
export const useConcertListRefresh = () => {
  const queryClient = useQueryClient();
  
  return {
    refreshConcertList: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts', 'list'] });
    },
    
    refreshConcertAvailability: (concertId: string) => {
      queryClient.invalidateQueries({ queryKey: ['concerts', 'availability', concertId] });
    },
    
    refreshAll: () => {
      queryClient.invalidateQueries({ queryKey: ['concerts'] });
    },
  };
};

// 콘서트 데이터 프리페치 훅
export const useConcertListPrefetch = () => {
  const queryClient = useQueryClient();
  
  return {
    prefetchConcertList: () => {
      queryClient.prefetchQuery({
        queryKey: ['concerts', 'list'],
        queryFn: fetchConcertList,
        staleTime: 5 * 60 * 1000,
      });
    },
    
    prefetchConcertAvailability: (concertId: string) => {
      queryClient.prefetchQuery({
        queryKey: ['concerts', 'availability', concertId],
        queryFn: () => fetchConcertAvailability(concertId),
        staleTime: 1 * 60 * 1000,
      });
    },
  };
};
