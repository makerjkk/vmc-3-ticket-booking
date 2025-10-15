'use client';

import { useCallback, useMemo } from 'react';
import { useSeatSelection } from '../context/seat-selection-context';
import {
  groupSeatsByGrade,
  calculatePriceBreakdown,
  formatPrice,
  formatSeatList,
} from '../lib/seat-utils';
import type { Seat } from '../lib/dto';

export interface BookingInfoHookReturn {
  // State
  selectedSeats: Seat[];
  totalPrice: number;
  selectedSeatCount: number;
  
  // Computed
  seatsByGrade: Record<string, Seat[]>;
  priceBreakdown: Array<{
    grade: string;
    count: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  
  // Actions
  removeSeat: (seatId: string) => void;
  clearAllSeats: () => void;
  
  // Utils
  formatPrice: (price: number) => string;
  formatSeatList: (seats: Seat[]) => string;
  
  // Validation
  canProceed: boolean;
  validationErrors: string[];
}

export const useBookingInfo = (): BookingInfoHookReturn => {
  const {
    state,
    actions,
    selectors,
  } = useSeatSelection();

  // 좌석 제거 핸들러
  const removeSeat = useCallback((seatId: string) => {
    actions.deselectSeat(seatId);
  }, [actions]);

  // 모든 좌석 제거 핸들러
  const clearAllSeats = useCallback(() => {
    actions.clearSelection();
  }, [actions]);

  // 등급별 좌석 그룹화
  const seatsByGrade = useMemo(() => {
    return groupSeatsByGrade(state.core.selectedSeats);
  }, [state.core.selectedSeats]);

  // 가격 분석
  const priceBreakdown = useMemo(() => {
    return calculatePriceBreakdown(seatsByGrade);
  }, [seatsByGrade]);

  // 진행 가능 여부 검증
  const validationErrors = useMemo(() => {
    const errors: string[] = [];

    if (state.core.selectedSeats.length === 0) {
      errors.push('좌석을 선택해주세요');
    }

    if (state.core.selectedSeats.length > 4) {
      errors.push('최대 4석까지만 선택할 수 있습니다');
    }

    // 충돌된 좌석이 있는지 확인
    if (state.sync.conflictSeats.length > 0) {
      errors.push('선택하신 좌석 중 일부가 다른 사용자에게 예약되었습니다');
    }

    // 선택된 좌석이 여전히 유효한지 확인
    const invalidSeats = state.core.selectedSeats.filter(seat => 
      seat.status !== 'available'
    );

    if (invalidSeats.length > 0) {
      errors.push('선택된 좌석 중 예약할 수 없는 좌석이 있습니다');
    }

    return errors;
  }, [state.core.selectedSeats, state.sync.conflictSeats]);

  const canProceed = useMemo(() => {
    return validationErrors.length === 0 && state.core.selectedSeats.length > 0;
  }, [validationErrors, state.core.selectedSeats]);

  return {
    // State
    selectedSeats: state.core.selectedSeats,
    totalPrice: selectors.totalPrice,
    selectedSeatCount: selectors.selectedSeatCount,

    // Computed
    seatsByGrade,
    priceBreakdown,

    // Actions
    removeSeat,
    clearAllSeats,

    // Utils
    formatPrice,
    formatSeatList,

    // Validation
    canProceed,
    validationErrors,
  };
};
