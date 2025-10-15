'use client';

import { useCallback, useMemo, useState } from 'react';
import { useSeatSelection } from '../context/seat-selection-context';
import type { Seat } from '../lib/dto';

export interface CompleteButtonHookReturn {
  // State
  isEnabled: boolean;
  isLoading: boolean;
  selectedSeatCount: number;
  
  // Actions
  onComplete: () => Promise<void>;
  
  // Computed
  buttonText: string;
  buttonDisabledReason: string | null;
  
  // Utils
  canProceed: () => boolean;
  getValidationErrors: () => string[];
}

export const useCompleteButton = (
  onCompleteCallback?: (seats: Seat[]) => void
): CompleteButtonHookReturn => {
  const {
    state,
    actions,
    selectors,
    sessionActions,
    syncActions,
    uiActions,
  } = useSeatSelection();


  // 유효성 검증 에러 목록
  const getValidationErrors = useCallback(() => {
    const errors: string[] = [];

    if (state.core.selectedSeats.length === 0) {
      errors.push('좌석을 선택해주세요');
    }

    if (state.core.selectedSeats.length > 4) {
      errors.push('최대 4석까지만 선택할 수 있습니다');
    }

    // 충돌된 좌석 확인
    if (state.sync.conflictSeats.length > 0) {
      errors.push('선택하신 좌석 중 일부가 다른 사용자에게 예약되었습니다');
    }

    // 선택된 좌석의 유효성 확인
    const invalidSeats = state.core.selectedSeats.filter(seat => 
      seat.status !== 'available'
    );

    if (invalidSeats.length > 0) {
      errors.push('선택된 좌석 중 예약할 수 없는 좌석이 있습니다');
    }

    // 스케줄 ID 확인
    if (!state.core.scheduleId) {
      errors.push('회차 정보가 없습니다');
    }

    return errors;
  }, [state.core.selectedSeats, state.core.scheduleId, state.sync.conflictSeats]);

  // 완료 처리 핸들러
  const onComplete = useCallback((): Promise<void> => {
    if (!selectors.canCompleteSelection) {
      return Promise.resolve();
    }

    // 최종 유효성 검증
    const validationErrors = getValidationErrors();
    if (validationErrors.length > 0) {
      return Promise.reject(new Error(validationErrors[0]));
    }

    // 세션 저장
    sessionActions.saveSession();

    // 완료 콜백 호출 (좌석 선택 완료 후 다음 페이지로 이동)
    if (onCompleteCallback) {
      onCompleteCallback(state.core.selectedSeats);
    }
    
    return Promise.resolve();
  }, [selectors.canCompleteSelection, getValidationErrors, sessionActions, onCompleteCallback, state.core.selectedSeats]);

  // 진행 가능 여부 확인
  const canProceed = useCallback(() => {
    return getValidationErrors().length === 0;
  }, [getValidationErrors]);

  // 버튼 활성화 여부
  const isEnabled = useMemo(() => {
    return selectors.canCompleteSelection && canProceed();
  }, [selectors.canCompleteSelection, canProceed]);

  // 버튼 텍스트
  const buttonText = useMemo(() => {
    if (state.core.selectedSeats.length === 0) {
      return '좌석을 선택해주세요';
    }

    if (state.core.selectedSeats.length === 1) {
      return '1석 선택 완료';
    }

    return `${state.core.selectedSeats.length}석 선택 완료`;
  }, [state.core.selectedSeats.length]);

  // 버튼 비활성화 이유
  const buttonDisabledReason = useMemo(() => {
    const errors = getValidationErrors();
    if (errors.length > 0) {
      return errors[0];
    }

    return null;
  }, [getValidationErrors]);

  return {
    // State
    isEnabled,
    isLoading: false, // 더 이상 로딩 상태가 없음
    selectedSeatCount: selectors.selectedSeatCount,

    // Actions
    onComplete,

    // Computed
    buttonText,
    buttonDisabledReason,

    // Utils
    canProceed,
    getValidationErrors,
  };
};
