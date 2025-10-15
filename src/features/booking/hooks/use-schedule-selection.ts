'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { apiClient } from '@/lib/remote/api-client';
import type {
  ScheduleListResponse,
  SeatLayoutResponse,
  SeatCountUpdate,
  ScheduleAvailability,
  ApiError,
} from '../lib/dto';

// Query Keys
export const scheduleQueryKeys = {
  all: ['schedules'] as const,
  lists: () => [...scheduleQueryKeys.all, 'list'] as const,
  list: (concertId: string, date: string) => [...scheduleQueryKeys.lists(), concertId, date] as const,
  seats: () => [...scheduleQueryKeys.all, 'seats'] as const,
  seatLayout: (scheduleId: string) => [...scheduleQueryKeys.seats(), scheduleId] as const,
  seatCount: (scheduleId: string) => [...scheduleQueryKeys.seats(), scheduleId, 'count'] as const,
  availability: (scheduleId: string) => [...scheduleQueryKeys.all, 'availability', scheduleId] as const,
};

// API 호출 함수들
const fetchSchedulesByDate = async (concertId: string, date: string): Promise<ScheduleListResponse> => {
  const response = await apiClient.get(`/api/concerts/${concertId}/schedules`, {
    params: { date },
  });
  return response.data;
};

const fetchSeatLayout = async (scheduleId: string): Promise<SeatLayoutResponse> => {
  const response = await apiClient.get(`/api/schedules/${scheduleId}/seats`);
  return response.data;
};

const fetchSeatCount = async (scheduleId: string): Promise<SeatCountUpdate> => {
  const response = await apiClient.get(`/api/schedules/${scheduleId}/seats/count`);
  return response.data;
};

const fetchScheduleAvailability = async (scheduleId: string): Promise<ScheduleAvailability> => {
  const response = await apiClient.get(`/api/schedules/${scheduleId}/availability`);
  return response.data;
};

// 날짜별 회차 목록 조회 훅
export const useSchedulesByDate = (concertId: string, date: string | null, enabled = true) => {
  return useQuery({
    queryKey: scheduleQueryKeys.list(concertId, date || ''),
    queryFn: () => fetchSchedulesByDate(concertId, date!),
    enabled: enabled && !!date,
    staleTime: 1000 * 60, // 1분
    gcTime: 1000 * 60 * 5, // 5분
    retry: (failureCount, error) => {
      // 4xx 에러는 재시도하지 않음
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// 좌석 배치도 조회 훅
export const useSeatLayout = (scheduleId: string | null, enabled = true) => {
  return useQuery({
    queryKey: scheduleQueryKeys.seatLayout(scheduleId || ''),
    queryFn: () => fetchSeatLayout(scheduleId!),
    enabled: enabled && !!scheduleId,
    staleTime: 1000 * 60 * 2, // 2분
    gcTime: 1000 * 60 * 10, // 10분
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

// 실시간 좌석 수 조회 훅
export const useRealTimeSeatCount = (scheduleId: string | null, enabled = true) => {
  return useQuery({
    queryKey: scheduleQueryKeys.seatCount(scheduleId || ''),
    queryFn: () => fetchSeatCount(scheduleId!),
    enabled: enabled && !!scheduleId,
    refetchInterval: 5000, // 5초마다 자동 갱신
    staleTime: 0, // 항상 최신 데이터 요청
    gcTime: 1000 * 60, // 1분
    retry: (failureCount, error) => {
      if (error && typeof error === 'object' && 'status' in error) {
        const status = error.status as number;
        if (status >= 400 && status < 500) {
          return false;
        }
      }
      return failureCount < 2; // 실시간 업데이트는 재시도 횟수 줄임
    },
    retryDelay: 1000, // 빠른 재시도
  });
};

// 회차 예매 가능 여부 확인 훅
export const useScheduleAvailability = (scheduleId: string | null, enabled = true) => {
  return useQuery({
    queryKey: scheduleQueryKeys.availability(scheduleId || ''),
    queryFn: () => fetchScheduleAvailability(scheduleId!),
    enabled: enabled && !!scheduleId,
    staleTime: 1000 * 30, // 30초
    gcTime: 1000 * 60 * 2, // 2분
    retry: 2,
    retryDelay: 1000,
  });
};

// 폴링 관리 훅
export const useSchedulePolling = (scheduleId: string | null, enabled = true) => {
  const queryClient = useQueryClient();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;
  const baseInterval = 5000; // 5초

  const startPolling = useCallback(() => {
    if (intervalRef.current || !scheduleId || !enabled) {
      return;
    }

    const pollSeatCount = () => {
      fetchSeatCount(scheduleId)
        .then(data => {
          // 기존 데이터와 비교하여 변화가 있을 때만 업데이트
          const currentData = queryClient.getQueryData(scheduleQueryKeys.seatCount(scheduleId));
          if (currentData && JSON.stringify(currentData) !== JSON.stringify(data)) {
            queryClient.setQueryData(scheduleQueryKeys.seatCount(scheduleId), data);
          }
          
          retryCountRef.current = 0; // 성공 시 재시도 카운트 리셋
        })
        .catch(error => {
          retryCountRef.current += 1;
          
          if (retryCountRef.current >= maxRetries) {
            console.error('폴링 최대 재시도 횟수 초과:', error);
            stopPolling();
            return;
          }
          
          // 지수 백오프 적용
          const backoffDelay = baseInterval * Math.pow(2, retryCountRef.current - 1);
          setTimeout(pollSeatCount, backoffDelay);
        });
    };

    intervalRef.current = setInterval(pollSeatCount, baseInterval);
  }, [scheduleId, enabled, queryClient]);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    retryCountRef.current = 0;
  }, []);

  // 백그라운드 탭에서 폴링 중지
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopPolling();
      } else if (enabled && scheduleId) {
        startPolling();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, scheduleId, startPolling, stopPolling]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  return {
    startPolling,
    stopPolling,
    isPolling: intervalRef.current !== null,
    retryCount: retryCountRef.current,
  };
};

// 캐시 무효화 유틸리티 훅
export const useScheduleCacheUtils = () => {
  const queryClient = useQueryClient();

  const invalidateSchedules = useCallback((concertId: string, date?: string) => {
    if (date) {
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.list(concertId, date),
      });
    } else {
      queryClient.invalidateQueries({
        queryKey: scheduleQueryKeys.lists(),
      });
    }
  }, [queryClient]);

  const invalidateSeatLayout = useCallback((scheduleId: string) => {
    queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.seatLayout(scheduleId),
    });
  }, [queryClient]);

  const invalidateSeatCount = useCallback((scheduleId: string) => {
    queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.seatCount(scheduleId),
    });
  }, [queryClient]);

  const invalidateAll = useCallback(() => {
    queryClient.invalidateQueries({
      queryKey: scheduleQueryKeys.all,
    });
  }, [queryClient]);

  const prefetchSeatLayout = useCallback((scheduleId: string) => {
    queryClient.prefetchQuery({
      queryKey: scheduleQueryKeys.seatLayout(scheduleId),
      queryFn: () => fetchSeatLayout(scheduleId),
      staleTime: 1000 * 60 * 2,
    }).catch(console.error);
  }, [queryClient]);

  return {
    invalidateSchedules,
    invalidateSeatLayout,
    invalidateSeatCount,
    invalidateAll,
    prefetchSeatLayout,
  };
};

// 에러 처리 유틸리티 훅
export const useScheduleErrorHandler = () => {
  const handleApiError = useCallback((error: unknown): ApiError => {
    if (error && typeof error === 'object' && 'response' in error) {
      const response = (error as any).response;
      return {
        code: response?.data?.error?.code || 'UNKNOWN_ERROR',
        message: response?.data?.error?.message || '알 수 없는 오류가 발생했습니다',
        details: response?.data?.error?.details,
      };
    }

    if (error instanceof Error) {
      return {
        code: 'NETWORK_ERROR',
        message: error.message || '네트워크 오류가 발생했습니다',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: '알 수 없는 오류가 발생했습니다',
    };
  }, []);

  const getErrorMessage = useCallback((error: unknown): string => {
    const apiError = handleApiError(error);
    return apiError.message;
  }, [handleApiError]);

  const isRetryableError = useCallback((error: unknown): boolean => {
    const apiError = handleApiError(error);
    
    // 4xx 에러는 재시도하지 않음
    if (error && typeof error === 'object' && 'response' in error) {
      const status = (error as any).response?.status;
      if (status >= 400 && status < 500) {
        return false;
      }
    }
    
    // 네트워크 에러나 5xx 에러는 재시도 가능
    return ['NETWORK_ERROR', 'SERVER_ERROR', 'UNKNOWN_ERROR'].includes(apiError.code);
  }, [handleApiError]);

  return {
    handleApiError,
    getErrorMessage,
    isRetryableError,
  };
};
