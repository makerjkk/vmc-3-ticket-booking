'use client';

import React, { createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import { useConcertListQuery } from '@/features/concerts/hooks/use-concert-list';
import type { ConcertItem } from '@/features/concerts/lib/dto';

// 간단한 Context Value 인터페이스
export interface ConcertListContextValue {
  // React Query 상태 직접 노출
  concerts: ConcertItem[];
  isLoading: boolean;
  error: string | null;
  
  // 액션 함수들
  refetch: () => void;
  navigateToBooking: (concertId: string) => void;
}

// Context 생성
const ConcertListContext = createContext<ConcertListContextValue | null>(null);

// Provider 컴포넌트
export function ConcertListProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const concertListQuery = useConcertListQuery();

  // 예매 페이지로 이동
  const navigateToBooking = (concertId: string) => {
    router.push(`/booking/${concertId}`);
  };

  // Context 값 구성
  const contextValue: ConcertListContextValue = {
    concerts: concertListQuery.data?.concerts || [],
    isLoading: concertListQuery.isLoading,
    error: concertListQuery.error instanceof Error ? concertListQuery.error.message : null,
    refetch: () => concertListQuery.refetch(),
    navigateToBooking,
  };

  return (
    <ConcertListContext.Provider value={contextValue}>
      {children}
    </ConcertListContext.Provider>
  );
}

// Context 사용 훅
export function useConcertListContext() {
  const context = useContext(ConcertListContext);
  
  if (!context) {
    throw new Error('useConcertListContext는 ConcertListProvider 내에서 사용해야 합니다');
  }
  
  return context;
}
