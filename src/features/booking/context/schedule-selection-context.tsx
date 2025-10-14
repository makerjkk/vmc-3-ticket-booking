'use client';

import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useScheduleSelectionReducer, type ScheduleSelectionState } from '../hooks/use-schedule-selection-reducer';
import type {
  ScheduleItem,
  SeatData,
  SelectedSeatInfo,
  TooltipState,
  BookingProgress,
} from '../lib/dto';

// Context 인터페이스 정의
interface ScheduleSelectionContextValue {
  // 상태
  state: ScheduleSelectionState;
  
  // 기본 액션 함수
  selectDate: (date: string) => void;
  selectSchedule: (scheduleId: string) => void;
  selectSeat: (seatId: string) => void;
  deselectSeat: (seatId: string) => void;
  clearSelectedSeats: () => void;
  
  // 로딩 액션
  loadSchedulesStart: () => void;
  loadSchedulesSuccess: (schedules: ScheduleItem[]) => void;
  loadSchedulesFailure: (error: Error) => void;
  loadSeatsStart: () => void;
  loadSeatsSuccess: (seats: SeatData[]) => void;
  loadSeatsFailure: (error: Error) => void;
  
  // 실시간 업데이트 액션
  updateSeatCountStart: () => void;
  updateSeatCountSuccess: (data: { scheduleId: string; availableSeats: number; totalSeats: number }) => void;
  updateSeatCountFailure: (error: Error) => void;
  startPolling: (interval: NodeJS.Timeout) => void;
  stopPolling: () => void;
  
  // UI 액션
  showTooltip: (tooltip: TooltipState) => void;
  hideTooltip: () => void;
  updateBookingProgress: (progress: Partial<BookingProgress>) => void;
  setOfflineStatus: (isOffline: boolean) => void;
  resetState: () => void;
  
  // 유틸리티 함수
  isScheduleAvailable: (scheduleId: string) => boolean;
  isSeatAvailable: (seatId: string) => boolean;
  getScheduleById: (scheduleId: string) => ScheduleItem | null;
  getSeatById: (seatId: string) => SeatData | null;
  
  // 계산된 값
  availableSchedules: ScheduleItem[];
  selectedScheduleInfo: ScheduleItem | null;
  availableSeatsCount: number;
  selectedSeatsInfo: SelectedSeatInfo[];
  canProceedToNextStep: boolean;
}

// Context 생성
const ScheduleSelectionContext = createContext<ScheduleSelectionContextValue | null>(null);

// Provider Props
interface ScheduleSelectionProviderProps {
  children: React.ReactNode;
  concertId: string;
}

// Provider 컴포넌트
export const ScheduleSelectionProvider: React.FC<ScheduleSelectionProviderProps> = ({
  children,
  concertId,
}) => {
  const { state, actions } = useScheduleSelectionReducer();

  // 유틸리티 함수들
  const isScheduleAvailable = useCallback((scheduleId: string): boolean => {
    const schedule = state.schedules?.find(s => s.id === scheduleId);
    if (!schedule) return false;
    
    return !schedule.isSoldOut && new Date(schedule.dateTime) > new Date();
  }, [state.schedules]);

  const isSeatAvailable = useCallback((seatId: string): boolean => {
    const seat = state.seats?.find(s => s.id === seatId);
    if (!seat) return false;
    
    return seat.status === 'available';
  }, [state.seats]);

  const getScheduleById = useCallback((scheduleId: string): ScheduleItem | null => {
    return state.schedules?.find(s => s.id === scheduleId) || null;
  }, [state.schedules]);

  const getSeatById = useCallback((seatId: string): SeatData | null => {
    return state.seats?.find(s => s.id === seatId) || null;
  }, [state.seats]);

  // 계산된 값들
  const availableSchedules = useMemo(() => {
    if (!state.schedules) return [];
    
    return state.schedules.filter(schedule => 
      !schedule.isSoldOut && new Date(schedule.dateTime) > new Date()
    );
  }, [state.schedules]);

  const selectedScheduleInfo = useMemo(() => {
    if (!state.selectedScheduleId || !state.schedules) return null;
    
    return state.schedules.find(s => s.id === state.selectedScheduleId) || null;
  }, [state.selectedScheduleId, state.schedules]);

  const availableSeatsCount = useMemo(() => {
    if (!state.seats) return 0;
    
    return state.seats.filter(seat => seat.status === 'available').length;
  }, [state.seats]);

  const selectedSeatsInfo = useMemo((): SelectedSeatInfo[] => {
    if (!state.selectedSeats.length || !state.seats) return [];
    
    return state.selectedSeats
      .map(seatId => {
        const seat = state.seats?.find(s => s.id === seatId);
        if (!seat) return null;
        
        return {
          seatId: seat.id,
          seatNumber: seat.seatNumber,
          grade: seat.grade,
          price: seat.price,
        };
      })
      .filter((info): info is SelectedSeatInfo => info !== null);
  }, [state.selectedSeats, state.seats]);

  const canProceedToNextStep = useMemo(() => {
    switch (state.bookingProgress.currentStep) {
      case 'date':
        return !!state.selectedDate;
      case 'schedule':
        return !!state.selectedScheduleId;
      case 'seat':
        return state.selectedSeats.length > 0;
      case 'payment':
        return true;
      default:
        return false;
    }
  }, [state.bookingProgress.currentStep, state.selectedDate, state.selectedScheduleId, state.selectedSeats]);

  // 총 가격 자동 계산
  useEffect(() => {
    const totalPrice = selectedSeatsInfo.reduce((sum, seat) => sum + seat.price, 0);
    if (totalPrice !== state.totalPrice) {
      actions.updateTotalPrice(totalPrice);
    }
  }, [selectedSeatsInfo, state.totalPrice, actions]);

  // 온라인/오프라인 상태 감지
  useEffect(() => {
    const handleOnline = () => actions.setOfflineStatus(false);
    const handleOffline = () => actions.setOfflineStatus(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 초기 상태 설정
    actions.setOfflineStatus(!navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [actions]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      actions.stopPolling();
    };
  }, [actions]);

  // Context 값 구성
  const contextValue: ScheduleSelectionContextValue = useMemo(() => ({
    // 상태
    state,
    
    // 기본 액션
    selectDate: actions.selectDate,
    selectSchedule: actions.selectSchedule,
    selectSeat: actions.selectSeat,
    deselectSeat: actions.deselectSeat,
    clearSelectedSeats: actions.clearSelectedSeats,
    
    // 로딩 액션
    loadSchedulesStart: actions.loadSchedulesStart,
    loadSchedulesSuccess: actions.loadSchedulesSuccess,
    loadSchedulesFailure: actions.loadSchedulesFailure,
    loadSeatsStart: actions.loadSeatsStart,
    loadSeatsSuccess: actions.loadSeatsSuccess,
    loadSeatsFailure: actions.loadSeatsFailure,
    
    // 실시간 업데이트 액션
    updateSeatCountStart: actions.updateSeatCountStart,
    updateSeatCountSuccess: actions.updateSeatCountSuccess,
    updateSeatCountFailure: actions.updateSeatCountFailure,
    startPolling: actions.startPolling,
    stopPolling: actions.stopPolling,
    
    // UI 액션
    showTooltip: actions.showTooltip,
    hideTooltip: actions.hideTooltip,
    updateBookingProgress: actions.updateBookingProgress,
    setOfflineStatus: actions.setOfflineStatus,
    resetState: actions.resetState,
    
    // 유틸리티 함수
    isScheduleAvailable,
    isSeatAvailable,
    getScheduleById,
    getSeatById,
    
    // 계산된 값
    availableSchedules,
    selectedScheduleInfo,
    availableSeatsCount,
    selectedSeatsInfo,
    canProceedToNextStep,
  }), [
    state,
    actions,
    isScheduleAvailable,
    isSeatAvailable,
    getScheduleById,
    getSeatById,
    availableSchedules,
    selectedScheduleInfo,
    availableSeatsCount,
    selectedSeatsInfo,
    canProceedToNextStep,
  ]);

  return (
    <ScheduleSelectionContext.Provider value={contextValue}>
      {children}
    </ScheduleSelectionContext.Provider>
  );
};

// Context 사용 훅
export const useScheduleSelection = (): ScheduleSelectionContextValue => {
  const context = useContext(ScheduleSelectionContext);
  
  if (!context) {
    throw new Error('useScheduleSelection must be used within a ScheduleSelectionProvider');
  }
  
  return context;
};

// 개별 상태 선택 훅들 (성능 최적화용)
export const useScheduleSelectionState = () => {
  const { state } = useScheduleSelection();
  return state;
};

export const useSelectedSchedule = () => {
  const { selectedScheduleInfo } = useScheduleSelection();
  return selectedScheduleInfo;
};

export const useSelectedSeats = () => {
  const { selectedSeatsInfo, state } = useScheduleSelection();
  return {
    selectedSeats: selectedSeatsInfo,
    totalPrice: state.totalPrice,
    count: selectedSeatsInfo.length,
  };
};

export const useBookingProgress = () => {
  const { state, canProceedToNextStep } = useScheduleSelection();
  return {
    progress: state.bookingProgress,
    canProceed: canProceedToNextStep,
  };
};
