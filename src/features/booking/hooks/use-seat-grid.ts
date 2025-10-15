'use client';

import { useCallback, useMemo } from 'react';
import { useSeatSelection } from '../context/seat-selection-context';
import {
  getSeatStatus,
  getSeatAriaLabel,
  getSeatClassName,
  isSeatSelectable,
  getSeatUnavailableMessage,
  handleArrowNavigation,
  SEAT_GRADE_COLORS,
} from '../lib/seat-utils';
import type { Seat, SeatStatus } from '../lib/dto';

export interface SeatGridHookReturn {
  // State
  seats: Seat[];
  selectedSeats: Seat[];
  conflictSeats: string[];
  focusedSeatId: string | null;
  isLoading: boolean;
  
  // Actions
  onSeatClick: (seat: Seat) => void;
  onSeatHover: (seat: Seat | null) => void;
  onSeatFocus: (seatId: string | null) => void;
  onSeatKeyDown: (event: React.KeyboardEvent, seat: Seat) => void;
  
  // Computed
  seatStatusMap: Record<string, SeatStatus>;
  gradeColorMap: Record<string, string>;
  
  // Utils
  getSeatAriaLabel: (seat: Seat) => string;
  getSeatClassName: (seat: Seat) => string;
  isSeatSelectable: (seat: Seat) => boolean;
}

export const useSeatGrid = (): SeatGridHookReturn => {
  const {
    state,
    actions,
    uiActions,
    selectors
  } = useSeatSelection();

  // 좌석 클릭 핸들러
  const onSeatClick = useCallback((seat: Seat) => {
    if (!isSeatSelectable(seat)) {
      uiActions.showTooltip({
        visible: true,
        message: getSeatUnavailableMessage(seat),
        type: 'warning',
        position: { x: 0, y: 0 } // 실제로는 마우스 위치 계산 필요
      });
      return;
    }

    const selectedSeats = state.core.selectedSeats || [];
    const isCurrentlySelected = selectedSeats.some(s => s && s.id === seat.id);

    if (isCurrentlySelected) {
      actions.deselectSeat(seat.id);
    } else {
      if (selectors.isMaxSeatsSelected) {
        uiActions.showAlert({
          message: '최대 4석까지만 선택할 수 있습니다',
          type: 'warning',
          duration: 3000
        });
        return;
      }

      actions.selectSeat(seat);
    }
  }, [state.core.selectedSeats, actions, uiActions, selectors.isMaxSeatsSelected]);

  // 좌석 호버 핸들러
  const onSeatHover = useCallback((seat: Seat | null) => {
    if (!seat) {
      uiActions.hideTooltip();
      return;
    }

    // 선택 불가능한 좌석에 대한 툴팁 표시
    if (!isSeatSelectable(seat)) {
      uiActions.showTooltip({
        visible: true,
        message: getSeatUnavailableMessage(seat),
        type: 'info',
        position: { x: 0, y: 0 }
      });
    } else {
      uiActions.hideTooltip();
    }
  }, [uiActions]);

  // 좌석 포커스 핸들러
  const onSeatFocus = useCallback((seatId: string | null) => {
    uiActions.setFocus(seatId);
  }, [uiActions]);

  // 키보드 네비게이션 핸들러
  const onSeatKeyDown = useCallback((event: React.KeyboardEvent, seat: Seat) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSeatClick(seat);
        break;
      case 'ArrowUp':
      case 'ArrowDown':
      case 'ArrowLeft':
      case 'ArrowRight':
        event.preventDefault();
        const seatLayoutData = state.core.seatLayoutData || [];
        const nextSeat = handleArrowNavigation(event.key, seat, seatLayoutData);
        if (nextSeat) {
          uiActions.setFocus(nextSeat.id);
        }
        break;
      case 'Escape':
        uiActions.setFocus(null);
        uiActions.hideTooltip();
        break;
      case 'Home':
        event.preventDefault();
        // 첫 번째 좌석으로 이동
        const firstSeatData = state.core.seatLayoutData || [];
        if (firstSeatData.length > 0 && firstSeatData[0]) {
          uiActions.setFocus(firstSeatData[0].id);
        }
        break;
      case 'End':
        event.preventDefault();
        // 마지막 좌석으로 이동
        const lastSeatData = state.core.seatLayoutData || [];
        if (lastSeatData.length > 0) {
          const lastSeat = lastSeatData[lastSeatData.length - 1];
          if (lastSeat) {
            uiActions.setFocus(lastSeat.id);
          }
        }
        break;
    }
  }, [onSeatClick, state.core.seatLayoutData, uiActions]);

  // 좌석 상태 맵 계산
  const seatStatusMap = useMemo(() => {
    const map: Record<string, SeatStatus> = {};

    // 방어적 프로그래밍: 배열이 존재하고 유효한지 확인
    const seatLayoutData = state.core.seatLayoutData || [];
    const selectedSeats = state.core.selectedSeats || [];
    const conflictSeats = state.sync.conflictSeats || [];

    seatLayoutData.forEach(seat => {
      if (!seat || !seat.id) return; // 유효하지 않은 좌석 데이터 건너뛰기
      
      const isSelected = selectedSeats.some(s => s && s.id === seat.id);
      const isConflict = conflictSeats.includes(seat.id);

      map[seat.id] = getSeatStatus(seat, isSelected, isConflict);
    });

    return map;
  }, [state.core.seatLayoutData, state.core.selectedSeats, state.sync.conflictSeats]);

  // 유틸리티 함수들
  const getSeatAriaLabelWrapper = useCallback((seat: Seat) => {
    const status = seatStatusMap[seat.id] || 'available';
    return getSeatAriaLabel(seat, status);
  }, [seatStatusMap]);

  const getSeatClassNameWrapper = useCallback((seat: Seat) => {
    const status = seatStatusMap[seat.id] || 'available';
    return getSeatClassName(seat, status);
  }, [seatStatusMap]);

  return {
    // State
    seats: state.core.seatLayoutData || [],
    selectedSeats: state.core.selectedSeats || [],
    conflictSeats: state.sync.conflictSeats || [],
    focusedSeatId: state.ui.focusedSeatId,
    isLoading: state.core.isLoading,

    // Actions
    onSeatClick,
    onSeatHover,
    onSeatFocus,
    onSeatKeyDown,

    // Computed
    seatStatusMap,
    gradeColorMap: SEAT_GRADE_COLORS,

    // Utils
    getSeatAriaLabel: getSeatAriaLabelWrapper,
    getSeatClassName: getSeatClassNameWrapper,
    isSeatSelectable,
  };
};
