'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

// 예매 가능한 날짜 타입
export interface AvailableDate {
  date: string; // YYYY-MM-DD 형식
  scheduleCount: number; // 해당 날짜의 회차 수
  hasAvailableSeats: boolean; // 예매 가능한 좌석이 있는지 여부
  schedules?: Array<{ // 해당 날짜의 스케줄 정보
    time: string; // HH:MM 형식
    dateTime: string; // ISO 형식
    hasAvailableSeats: boolean;
  }>;
}

// API 응답 타입
interface AvailableDatesApiResponse {
  concertId: string;
  availableDates: AvailableDate[];
}

/**
 * 예매 가능한 날짜 조회 함수
 */
const fetchAvailableDates = async (concertId: string): Promise<AvailableDate[]> => {
  try {
    const response = await apiClient.get<AvailableDatesApiResponse>(`/api/concerts/${concertId}/available-dates`);
    const availableDatesData = response.data;
    return availableDatesData.availableDates || [];
  } catch (error) {
    console.error('예매 가능한 날짜 조회 에러:', error);
    throw new Error('예매 가능한 날짜를 불러올 수 없습니다');
  }
};

/**
 * 예매 가능한 날짜 조회 훅
 */
export const useAvailableDates = (concertId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['concert', concertId, 'available-dates'],
    queryFn: () => fetchAvailableDates(concertId),
    enabled: enabled && !!concertId,
    staleTime: 1 * 60 * 1000, // 1분간 캐시 유지 (실시간성 중요)
    gcTime: 5 * 60 * 1000, // 5분간 가비지 컬렉션 방지
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: true, // 창 포커스 시 재조회
    refetchInterval: 30 * 1000, // 30초마다 자동 갱신
  });
};
