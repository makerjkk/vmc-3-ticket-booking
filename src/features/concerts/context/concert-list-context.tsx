'use client';

import React, { createContext, useContext, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useConcertListReducer, type ConcertListState, type ToastMessage } from '@/features/concerts/hooks/use-concert-list-reducer';
import { useConcertListQuery, useConcertAvailabilityQuery } from '@/features/concerts/hooks/use-concert-list';
import type { ConcertItem } from '@/features/concerts/lib/dto';

// Context Value 인터페이스
export interface ConcertListContextValue {
  // === 상태 (State) ===
  state: ConcertListState;
  
  // === 액션 함수 (Actions) ===
  actions: {
    // 콘서트 목록 관련
    fetchConcerts: () => Promise<void>;
    retryFetchConcerts: () => Promise<void>;
    resetError: () => void;
    
    // 예매 가능 여부 확인 관련
    checkConcertAvailability: (concertId: string) => Promise<boolean>;
    
    // 토스트 메시지 관련
    showToast: (message: ToastMessage) => void;
    hideToast: () => void;
    
    // 네비게이션 관련
    navigateToBooking: (concertId: string) => Promise<void>;
  };
  
  // === 셀렉터 (Selectors) ===
  selectors: {
    // 상태 조회
    getLoadingState: () => boolean;
    getConcerts: () => ConcertItem[];
    getError: () => string | null;
    getRetryCount: () => number;
    getToastMessage: () => ToastMessage | null;
    
    // 특정 콘서트 관련
    isCheckingAvailability: (concertId: string) => boolean;
    getConcertById: (concertId: string) => ConcertItem | undefined;
    
    // 상태 체크
    hasError: () => boolean;
    canRetry: () => boolean;
    isEmpty: () => boolean;
  };
  
  // === 이벤트 핸들러 (Event Handlers) ===
  handlers: {
    // 사용자 상호작용
    onConcertCardClick: (concertId: string) => void;
    onBookingButtonClick: (concertId: string) => void;
    onRetryButtonClick: () => void;
    onToastClose: () => void;
    
    // 라이프사이클
    onMount: () => void;
    onUnmount: () => void;
    onRefresh: () => void;
  };
  
  // === 유틸리티 (Utilities) ===
  utils: {
    // 상태 검증
    validateConcertData: (concerts: ConcertItem[]) => boolean;
    formatError: (error: unknown) => string;
    
    // 성능 최적화
    memoizedConcerts: ConcertItem[];
    debouncedRetry: () => void;
  };
}

// Provider Props 인터페이스
export interface ConcertListProviderProps {
  children: React.ReactNode;
  
  // === 설정 옵션 ===
  config?: {
    // API 설정
    apiTimeout?: number;
    
    // 재시도 설정
    maxRetryCount?: number;
    retryDelay?: number;
    enableAutoRetry?: boolean;
    
    // 토스트 설정
    toastDuration?: number;
    
    // 캐싱 설정
    enableCaching?: boolean;
    cacheTimeout?: number;
  };
  
  // === 초기 상태 ===
  initialState?: Partial<ConcertListState>;
  
  // === 콜백 함수 ===
  onStateChange?: (state: ConcertListState) => void;
  onError?: (error: string) => void;
  onSuccess?: (concerts: ConcertItem[]) => void;
}

// Context 생성
const ConcertListContext = createContext<ConcertListContextValue | null>(null);

// Provider 컴포넌트
export function ConcertListProvider({ 
  children, 
  config = {},
  onStateChange,
  onError,
  onSuccess,
}: ConcertListProviderProps) {
  const { state, actions: reducerActions } = useConcertListReducer();
  const router = useRouter();

  // React Query 훅들
  const concertListQuery = useConcertListQuery();

  // 설정 기본값
  const {
    maxRetryCount = 3,
    retryDelay = 2000,
    enableAutoRetry = true,
    toastDuration = 4000,
    enableCaching = true,
    cacheTimeout = 300000, // 5분
  } = config;

  // 콘서트 목록 조회
  const fetchConcerts = useCallback(async () => {
    // React Query가 자동으로 로딩 상태를 관리하므로 별도 액션 불필요
    await concertListQuery.refetch();
  }, [concertListQuery]);

  // React Query 상태를 리듀서 상태와 동기화 (한 번만 실행)
  useEffect(() => {
    if (concertListQuery.isLoading && !state.isLoading) {
      reducerActions.fetchConcertsStart();
    } else if (concertListQuery.isError && !state.error) {
      const errorMessage = concertListQuery.error instanceof Error 
        ? concertListQuery.error.message 
        : '콘서트 목록을 불러오는데 실패했습니다';
      reducerActions.fetchConcertsError(errorMessage);
    } else if (concertListQuery.data && state.concerts.length === 0 && !state.isLoading) {
      reducerActions.fetchConcertsSuccess(concertListQuery.data.concerts);
    }
  }, [
    concertListQuery.isLoading, 
    concertListQuery.isError, 
    concertListQuery.error, 
    concertListQuery.data,
    state.isLoading,
    state.error,
    state.concerts.length,
    reducerActions.fetchConcertsStart,
    reducerActions.fetchConcertsError,
    reducerActions.fetchConcertsSuccess
  ]);

  // 재시도
  const retryFetchConcerts = useCallback(async () => {
    reducerActions.retryFetch();
    await fetchConcerts();
  }, [reducerActions, fetchConcerts]);

  // 예매 가능 여부 확인을 위한 상태
  const [checkingConcertId, setCheckingConcertId] = React.useState<string | null>(null);
  const availabilityQuery = useConcertAvailabilityQuery(
    checkingConcertId || '', 
    Boolean(checkingConcertId)
  );

  // 예매 가능 여부 확인
  const checkConcertAvailability = useCallback(async (concertId: string): Promise<boolean> => {
    reducerActions.checkAvailabilityStart(concertId);
    setCheckingConcertId(concertId);
    
    try {
      // React Query가 자동으로 API 호출을 처리
      // 결과는 useEffect에서 처리됨
      return true; // 임시로 true 반환, 실제 결과는 useEffect에서 처리
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '예매 가능 여부 확인 실패';
      reducerActions.checkAvailabilityError(errorMessage);
      setCheckingConcertId(null);
      return false;
    }
  }, [reducerActions]);

  // 예매 가능 여부 확인 결과 처리
  useEffect(() => {
    if (checkingConcertId && availabilityQuery.data) {
      if (availabilityQuery.data.available) {
        reducerActions.checkAvailabilitySuccess();
      } else {
        reducerActions.checkAvailabilityError(
          availabilityQuery.data.reason || '예매가 불가능합니다'
        );
      }
      setCheckingConcertId(null);
    } else if (checkingConcertId && availabilityQuery.isError) {
      const errorMessage = availabilityQuery.error instanceof Error 
        ? availabilityQuery.error.message 
        : '예매 가능 여부 확인 실패';
      reducerActions.checkAvailabilityError(errorMessage);
      setCheckingConcertId(null);
    }
  }, [
    checkingConcertId, 
    availabilityQuery.data, 
    availabilityQuery.isError, 
    availabilityQuery.error,
    reducerActions.checkAvailabilitySuccess,
    reducerActions.checkAvailabilityError
  ]);

  // 예매 페이지로 이동
  const navigateToBooking = useCallback(async (concertId: string) => {
    const isAvailable = await checkConcertAvailability(concertId);
    
    if (isAvailable) {
      router.push(`/booking/${concertId}`);
    } else {
      reducerActions.showToast({
        type: 'warning',
        message: '예매 기간이 종료되었습니다',
      });
    }
  }, [checkConcertAvailability, router, reducerActions]);

  // 셀렉터 함수들
  const selectors = useMemo(() => ({
    getLoadingState: () => state.isLoading,
    getConcerts: () => state.concerts,
    getError: () => state.error,
    getRetryCount: () => state.retryCount,
    getToastMessage: () => state.toastMessage,
    
    isCheckingAvailability: (concertId: string) => 
      state.selectedConcertId === concertId && state.isCheckingAvailability,
    getConcertById: (concertId: string) => 
      state.concerts.find(concert => concert.id === concertId),
    
    hasError: () => state.error !== null,
    canRetry: () => state.retryCount < maxRetryCount,
    isEmpty: () => state.concerts.length === 0 && !state.isLoading && !state.error,
  }), [state, maxRetryCount]);

  // 이벤트 핸들러들
  const handlers = useMemo(() => ({
    onConcertCardClick: (concertId: string) => {
      // 콘서트 카드 클릭 시 상세 정보 표시 등의 로직
    },
    
    onBookingButtonClick: (concertId: string) => {
      navigateToBooking(concertId);
    },
    
    onRetryButtonClick: () => {
      retryFetchConcerts();
    },
    
    onToastClose: () => {
      reducerActions.hideToast();
    },
    
    onMount: () => {
      fetchConcerts();
    },
    
    onUnmount: () => {
      // 정리 작업
    },
    
    onRefresh: () => {
      reducerActions.resetError();
      fetchConcerts();
    },
  }), [navigateToBooking, retryFetchConcerts, reducerActions, fetchConcerts]);

  // 유틸리티 함수들
  const utils = useMemo(() => ({
    validateConcertData: (concerts: ConcertItem[]) => {
      return Array.isArray(concerts) && concerts.every(concert => 
        typeof concert.id === 'string' && 
        typeof concert.title === 'string' &&
        typeof concert.posterImageUrl === 'string'
      );
    },
    
    formatError: (error: unknown) => {
      if (error instanceof Error) {
        return error.message;
      }
      if (typeof error === 'string') {
        return error;
      }
      return '알 수 없는 오류가 발생했습니다';
    },
    
    memoizedConcerts: state.concerts,
    
    debouncedRetry: () => {
      // 디바운스된 재시도 로직
      setTimeout(() => {
        if (selectors.canRetry()) {
          retryFetchConcerts();
        }
      }, retryDelay);
    },
  }), [state.concerts, selectors, retryDelay, retryFetchConcerts]);

  // 상태 변화 콜백
  useEffect(() => {
    onStateChange?.(state);
  }, [state, onStateChange]);

  // 에러 콜백
  useEffect(() => {
    if (state.error) {
      onError?.(state.error);
    }
  }, [state.error, onError]);

  // 성공 콜백
  useEffect(() => {
    if (state.concerts.length > 0 && !state.isLoading && !state.error) {
      onSuccess?.(state.concerts);
    }
  }, [state.concerts, state.isLoading, state.error, onSuccess]);

  // 토스트 자동 숨김
  useEffect(() => {
    if (state.toastMessage) {
      const timer = setTimeout(() => {
        reducerActions.hideToast();
      }, toastDuration);
      
      return () => clearTimeout(timer);
    }
  }, [state.toastMessage, toastDuration, reducerActions]);

  // Context 값 구성
  const contextValue: ConcertListContextValue = {
    state,
    actions: {
      fetchConcerts,
      retryFetchConcerts,
      resetError: reducerActions.resetError,
      checkConcertAvailability,
      showToast: reducerActions.showToast,
      hideToast: reducerActions.hideToast,
      navigateToBooking,
    },
    selectors,
    handlers,
    utils,
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
