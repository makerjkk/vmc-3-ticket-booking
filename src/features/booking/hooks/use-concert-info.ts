'use client';

import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/remote/api-client';

// 콘서트 정보 타입 (백엔드 응답과 일치)
export interface ConcertInfo {
  id: string;
  title: string;
  description: string | null;
  posterImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * 콘서트 정보 조회 함수
 */
const fetchConcertInfo = async (concertId: string): Promise<ConcertInfo> => {
  try {
    const response = await apiClient.get<ConcertInfo>(`/api/concerts/${concertId}`);
    return response.data;
  } catch (error) {
    console.error('콘서트 정보 조회 에러:', error);
    throw new Error('콘서트 정보를 불러올 수 없습니다');
  }
};

/**
 * 콘서트 정보 조회 훅
 */
export const useConcertInfo = (concertId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['concert', concertId],
    queryFn: () => fetchConcertInfo(concertId),
    enabled: enabled && !!concertId,
    staleTime: 5 * 60 * 1000, // 5분간 캐시 유지
    gcTime: 10 * 60 * 1000, // 10분간 가비지 컬렉션 방지
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};
