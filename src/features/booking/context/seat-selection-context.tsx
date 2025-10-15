'use client';

import React, { createContext, useContext, useMemo, useCallback, useEffect } from 'react';
import { useSeatSelectionReducer, type SeatSelectionState } from '../hooks/use-seat-selection-reducer';
import { detectConflicts } from '../lib/seat-utils';
import type {
  Seat,
  SeatStatus,
  TooltipState,
  AlertState,
  ConnectionStatus,
} from '../lib/dto';

// Context 인터페이스 정의
interface SeatSelectionContextValue {
  // State
  state: SeatSelectionState;
  
  // Core Actions
  actions: {
    loadSeats: (scheduleId: string) => Promise<void>;
    selectSeat: (seat: Seat) => void;
    deselectSeat: (seatId: string) => void;
    clearSelection: () => void;
    toggleSeatSelection: (seat: Seat) => void;
  };
  
  // Sync Actions
  syncActions: {
    startPolling: () => void;
    stopPolling: () => void;
    forceSync: () => Promise<void>;
    handleConflict: (conflictSeats: string[]) => void;
    syncSeatsSuccess: (seats: Seat[], timestamp: number) => void;
    syncSeatsError: (error: string) => void;
    conflictDetected: (conflictSeats: string[]) => void;
  };
  
  // UI Actions
  uiActions: {
    setFocus: (seatId: string | null) => void;
    showTooltip: (tooltip: TooltipState) => void;
    hideTooltip: () => void;
    showAlert: (alert: AlertState) => void;
    hideAlert: () => void;
    clearNotifications: () => void;
    setViewMode: (mode: 'grid' | 'list') => void;
  };
  
  // Session Actions
  sessionActions: {
    setHoldExpiry: (expiry: number) => void;
    clearHoldExpiry: () => void;
    updateActivity: () => void;
    restoreSession: () => void;
    saveSession: () => void;
    toggleAutoSave: (enabled: boolean) => void;
  };
  
  // Selectors (Computed Values)
  selectors: {
    totalPrice: number;
    selectedSeatCount: number;
    availableSeatCount: number;
    isMaxSeatsSelected: boolean;
    canCompleteSelection: boolean;
    conflictSeatNumbers: string[];
    holdTimeRemaining: number | null;
  };
  
  // Utils
  utils: {
    getSeatById: (seatId: string) => Seat | undefined;
    getSeatsByGrade: (grade: 'R' | 'S' | 'A') => Seat[];
    getSelectedSeatsByGrade: () => Record<string, Seat[]>;
    validateSeatSelection: (seat: Seat) => { valid: boolean; reason?: string };
    formatPrice: (price: number) => string;
    formatSeatNumber: (seat: Seat) => string;
  };
}

// Context 생성
const SeatSelectionContext = createContext<SeatSelectionContextValue | null>(null);

// Provider Props
interface SeatSelectionProviderProps {
  children: React.ReactNode;
  scheduleId: string;
  config?: {
    maxSeats?: number;
    pollingInterval?: number;
    autoSave?: boolean;
    enableWebSocket?: boolean;
    enableAnalytics?: boolean;
  };
  onError?: (error: Error) => void;
  onSelectionComplete?: (seats: Seat[]) => void;
  onConflictDetected?: (conflictSeats: string[]) => void;
}

// Provider 컴포넌트
export const SeatSelectionProvider: React.FC<SeatSelectionProviderProps> = ({
  children,
  scheduleId,
  config = {},
  onError,
  onSelectionComplete,
  onConflictDetected,
}) => {
  const { state, actions, selectors, dispatch } = useSeatSelectionReducer();
  
  const {
    maxSeats = 4,
    pollingInterval = 3000,
    autoSave = true,
    enableWebSocket = false,
    enableAnalytics = false,
  } = config;

  // Core Actions
  const coreActions = useMemo(() => ({
    loadSeats: (scheduleId: string): Promise<void> => {
      actions.loadSeatsStart(scheduleId);
      
      // API 호출
      return fetch(`/api/schedules/${scheduleId}/seats`)
        .then(response => {
          if (!response.ok) {
            if (response.status === 404) {
              throw new Error('선택하신 회차를 찾을 수 없습니다. 다시 회차를 선택해주세요.');
            } else if (response.status === 409) {
              throw new Error('선택하신 회차의 예매 시간이 지났습니다.');
            } else {
              throw new Error(`좌석 정보를 불러올 수 없습니다: ${response.statusText}`);
            }
          }
          return response.json();
        })
        .then(data => {
          // 개발 모드에서 디버깅 정보 출력
          if (process.env.NODE_ENV === 'development') {
            console.log('좌석 데이터 로드 응답:', data);
            console.log('요청한 스케줄 ID:', scheduleId);
          }
          
          // 응답 데이터 검증 및 안전한 처리
          if (!data) {
            throw new Error('서버로부터 응답을 받지 못했습니다.');
          }
          
          // seats 필드가 배열인지 확인하고 안전하게 처리
          const seats = Array.isArray(data.seats) ? data.seats : [];
          
          if (seats.length === 0) {
            throw new Error('해당 회차에 좌석 정보가 없습니다. 다른 회차를 선택해주세요.');
          }
          
          // 좌석 데이터 유효성 검증
          const validSeats = seats.filter(seat => 
            seat && 
            typeof seat === 'object' && 
            seat.id && 
            seat.seatNumber && 
            seat.grade && 
            typeof seat.price === 'number'
          );
          
          if (validSeats.length === 0) {
            throw new Error('유효한 좌석 정보가 없습니다.');
          }
          
          actions.loadSeatsSuccess(validSeats);
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
          actions.loadSeatsError(errorMessage);
          onError?.(error instanceof Error ? error : new Error(errorMessage));
        });
    },

    selectSeat: (seat: Seat) => {
      // 유효성 검증
      if (seat.status !== 'available') {
        actions.showAlert({
          message: seat.status === 'reserved' 
            ? '이미 예약된 좌석입니다' 
            : '선택할 수 없는 좌석입니다',
          type: 'warning',
          duration: 3000,
        });
        return;
      }

      // 이미 선택된 좌석인지 확인
      if (state.core.selectedSeats.some(s => s.id === seat.id)) {
        actions.showAlert({
          message: '이미 선택된 좌석입니다',
          type: 'warning',
          duration: 3000,
        });
        return;
      }

      // 최대 선택 수 확인
      if (state.core.selectedSeats.length >= maxSeats) {
        actions.showAlert({
          message: `최대 ${maxSeats}석까지만 선택할 수 있습니다`,
          type: 'warning',
          duration: 3000,
        });
        return;
      }

      actions.selectSeat(seat);
      
      // 자동 저장
      if (autoSave) {
        try {
          const sessionData = {
            core: {
              selectedSeats: state.core.selectedSeats,
              scheduleId: state.core.scheduleId,
            },
            session: {
              lastActivity: Date.now(),
            },
          };
          
          sessionStorage.setItem('seat_selection_session', JSON.stringify(sessionData));
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      }
    },

    deselectSeat: (seatId: string) => {
      actions.deselectSeat(seatId);
      
      // 자동 저장
      if (autoSave) {
        try {
          const sessionData = {
            core: {
              selectedSeats: state.core.selectedSeats,
              scheduleId: state.core.scheduleId,
            },
            session: {
              lastActivity: Date.now(),
            },
          };
          
          sessionStorage.setItem('seat_selection_session', JSON.stringify(sessionData));
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      }
    },

    clearSelection: () => {
      actions.clearSelection();
      
      // 자동 저장
      if (autoSave) {
        try {
          const sessionData = {
            core: {
              selectedSeats: state.core.selectedSeats,
              scheduleId: state.core.scheduleId,
            },
            session: {
              lastActivity: Date.now(),
            },
          };
          
          sessionStorage.setItem('seat_selection_session', JSON.stringify(sessionData));
        } catch (error) {
          console.error('Failed to save session:', error);
        }
      }
    },

    toggleSeatSelection: (seat: Seat) => {
      const isSelected = state.core.selectedSeats.some(s => s.id === seat.id);
      
      if (isSelected) {
        actions.deselectSeat(seat.id);
        
        // 자동 저장
        if (autoSave) {
          try {
            const sessionData = {
              core: {
                selectedSeats: state.core.selectedSeats.filter(s => s.id !== seat.id),
                scheduleId: state.core.scheduleId,
              },
              session: {
                lastActivity: Date.now(),
              },
            };
            
            sessionStorage.setItem('seat_selection_session', JSON.stringify(sessionData));
          } catch (error) {
            console.error('Failed to save session:', error);
          }
        }
      } else {
        // 유효성 검증
        if (seat.status !== 'available') {
          actions.showAlert({
            message: seat.status === 'reserved' 
              ? '이미 예약된 좌석입니다' 
              : '선택할 수 없는 좌석입니다',
            type: 'warning',
            duration: 3000,
          });
          return;
        }

        // 이미 선택된 좌석인지 확인
        if (state.core.selectedSeats.some(s => s.id === seat.id)) {
          actions.showAlert({
            message: '이미 선택된 좌석입니다',
            type: 'warning',
            duration: 3000,
          });
          return;
        }

        // 최대 선택 수 확인
        if (state.core.selectedSeats.length >= maxSeats) {
          actions.showAlert({
            message: `최대 ${maxSeats}석까지만 선택할 수 있습니다`,
            type: 'warning',
            duration: 3000,
          });
          return;
        }

        actions.selectSeat(seat);
        
        // 자동 저장
        if (autoSave) {
          try {
            const sessionData = {
              core: {
                selectedSeats: [...state.core.selectedSeats, seat],
                scheduleId: state.core.scheduleId,
              },
              session: {
                lastActivity: Date.now(),
              },
            };
            
            sessionStorage.setItem('seat_selection_session', JSON.stringify(sessionData));
          } catch (error) {
            console.error('Failed to save session:', error);
          }
        }
      }
    },
  }), [actions, state.core.selectedSeats, state.core.scheduleId, autoSave, maxSeats]);

  // Sync Actions
  const syncActions = useMemo(() => ({
    startPolling: () => {
      actions.startPolling();
    },

    stopPolling: () => {
      actions.stopPolling();
    },

    forceSync: (): Promise<void> => {
      // 비동기 작업을 Promise로 처리하되 async/await 사용하지 않음
      actions.syncSeatsStart();
      
      return fetch(`/api/schedules/${scheduleId}/seats/status`)
        .then(response => {
          if (!response.ok) {
            throw new Error(`Sync failed: ${response.statusText}`);
          }
          return response.json();
        })
        .then(data => {
          // 백엔드 respond 함수는 성공 시 result.data를 직접 반환
          // data는 SeatStatusUpdate 형태: { scheduleId, seats, timestamp }
          const seats = Array.isArray(data.seats) ? data.seats : [];
          
          // 좌석 데이터 유효성 검증
          const validSeats = seats.filter(seat => 
            seat && 
            typeof seat === 'object' && 
            seat.id && 
            seat.status
          );
          
          dispatch({ type: 'SYNC_SEATS_SUCCESS', payload: { seats: validSeats, timestamp: Date.now() } });
          
          // 충돌 감지
          const conflicts = detectConflicts(seats, state.core.selectedSeats);
          if (conflicts.length > 0) {
            dispatch({ type: 'CONFLICT_DETECTED', payload: { conflictSeats: conflicts } });
            onConflictDetected?.(conflicts);
          }
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          dispatch({ type: 'SYNC_SEATS_ERROR', payload: { error: errorMessage } });
          onError?.(error instanceof Error ? error : new Error(errorMessage));
        });
    },

    handleConflict: (conflictSeats: string[]) => {
      dispatch({ type: 'CONFLICT_DETECTED', payload: { conflictSeats } });
      onConflictDetected?.(conflictSeats);
    },

    syncSeatsSuccess: (seats: Seat[], timestamp: number) => {
      dispatch({ type: 'SYNC_SEATS_SUCCESS', payload: { seats, timestamp } });
    },

    syncSeatsError: (error: string) => {
      dispatch({ type: 'SYNC_SEATS_ERROR', payload: { error } });
    },

    conflictDetected: (conflictSeats: string[]) => {
      dispatch({ type: 'CONFLICT_DETECTED', payload: { conflictSeats } });
    },
  }), [actions, scheduleId, state.core.selectedSeats, onError, onConflictDetected, dispatch]);

  // UI Actions
  const uiActions = useMemo(() => ({
    setFocus: (seatId: string | null) => {
      actions.setFocus(seatId);
    },

    showTooltip: (tooltip: TooltipState) => {
      actions.showTooltip(tooltip);
      
      // 자동 숨김
      if (tooltip.type !== 'error') {
        setTimeout(() => {
          actions.hideTooltip();
        }, 2000);
      }
    },

    hideTooltip: () => {
      actions.hideTooltip();
    },

    showAlert: (alert: AlertState) => {
      actions.showAlert(alert);
      
      // 자동 숨김
      if (alert.duration) {
        setTimeout(() => {
          actions.hideAlert();
        }, alert.duration);
      }
    },

    hideAlert: () => {
      actions.hideAlert();
    },

    clearNotifications: () => {
      actions.clearNotifications();
    },

    setViewMode: (mode: 'grid' | 'list') => {
      actions.setViewMode(mode);
    },
  }), [actions]);

  // Session Actions
  const sessionActions = useMemo(() => ({
    setHoldExpiry: (expiry: number) => {
      actions.setHoldExpiry(expiry);
    },

    clearHoldExpiry: () => {
      actions.clearHoldExpiry();
    },

    updateActivity: () => {
      actions.updateActivity(Date.now());
    },

    restoreSession: () => {
      try {
        const stored = sessionStorage.getItem('seat_selection_session');
        if (stored) {
          const sessionData = JSON.parse(stored);
          actions.restoreSession(sessionData);
        }
      } catch (error) {
        console.error('Failed to restore session:', error);
      }
    },

    saveSession: () => {
      if (!autoSave) return;
      
      try {
        const sessionData = {
          core: {
            selectedSeats: state.core.selectedSeats,
            scheduleId: state.core.scheduleId,
          },
          session: {
            lastActivity: Date.now(),
          },
        };
        
        sessionStorage.setItem('seat_selection_session', JSON.stringify(sessionData));
      } catch (error) {
        console.error('Failed to save session:', error);
      }
    },

    toggleAutoSave: (enabled: boolean) => {
      actions.toggleAutoSave(enabled);
    },
  }), [actions, state.core.selectedSeats, state.core.scheduleId, autoSave]);

  // Utils
  const utils = useMemo(() => ({
    getSeatById: (seatId: string) => {
      const seatLayoutData = state.core.seatLayoutData || [];
      return seatLayoutData.find(seat => seat && seat.id === seatId);
    },

    getSeatsByGrade: (grade: 'R' | 'S' | 'A') => {
      const seatLayoutData = state.core.seatLayoutData || [];
      return seatLayoutData.filter(seat => seat && seat.grade === grade);
    },

    getSelectedSeatsByGrade: () => {
      const result: Record<string, Seat[]> = { R: [], S: [], A: [] };
      const selectedSeats = state.core.selectedSeats || [];
      
      selectedSeats.forEach(seat => {
        if (seat && seat.grade && result[seat.grade]) {
          result[seat.grade].push(seat);
        }
      });
      
      return result;
    },

    validateSeatSelection: (seat: Seat) => {
      // 좌석 상태 확인
      if (seat.status !== 'available') {
        return {
          valid: false,
          reason: seat.status === 'reserved' 
            ? '이미 예약된 좌석입니다' 
            : '선택할 수 없는 좌석입니다',
        };
      }

      // 이미 선택된 좌석인지 확인
      const selectedSeats = state.core.selectedSeats || [];
      if (selectedSeats.some(s => s && s.id === seat.id)) {
        return { valid: false, reason: '이미 선택된 좌석입니다' };
      }

      // 최대 선택 수 확인
      if (selectedSeats.length >= maxSeats) {
        return { valid: false, reason: `최대 ${maxSeats}석까지만 선택할 수 있습니다` };
      }

      return { valid: true };
    },

    formatPrice: (price: number) => {
      return new Intl.NumberFormat('ko-KR', {
        style: 'currency',
        currency: 'KRW',
      }).format(price);
    },

    formatSeatNumber: (seat: Seat) => {
      return `${seat.rowName}열 ${seat.seatIndex}번`;
    },
  }), [state.core.seatLayoutData, state.core.selectedSeats, maxSeats]);

  // 충돌 감지 헬퍼 함수
  const detectConflicts = useCallback((serverSeats: Seat[], selectedSeats: Seat[]) => {
    const conflicts: string[] = [];
    
    selectedSeats.forEach(selectedSeat => {
      const serverSeat = serverSeats.find(s => s.id === selectedSeat.id);
      if (serverSeat && serverSeat.status !== 'available') {
        conflicts.push(selectedSeat.id);
      }
    });
    
    return conflicts;
  }, []);

  // 초기화 및 정리
  useEffect(() => {
    // 세션 복원 (한 번만 실행)
    try {
      const stored = sessionStorage.getItem('seat_selection_session');
      if (stored) {
        const sessionData = JSON.parse(stored);
        actions.restoreSession(sessionData);
      }
    } catch (error) {
      console.error('Failed to restore session:', error);
    }
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 스케줄 ID 변경 시 좌석 로드
  useEffect(() => {
    if (scheduleId && scheduleId !== state.core.scheduleId) {
      // 직접 loadSeats 로직 실행 (coreActions 의존성 제거)
      const loadSeatsAsync = () => {
        actions.loadSeatsStart(scheduleId);
        
        fetch(`/api/schedules/${scheduleId}/seats`)
          .then(response => {
            if (!response.ok) {
              if (response.status === 404) {
                throw new Error('선택하신 회차를 찾을 수 없습니다. 다시 회차를 선택해주세요.');
              } else if (response.status === 409) {
                throw new Error('선택하신 회차의 예매 시간이 지났습니다.');
              } else {
                throw new Error(`좌석 정보를 불러올 수 없습니다: ${response.statusText}`);
              }
            }
            return response.json();
          })
          .then(data => {
            if (process.env.NODE_ENV === 'development') {
              console.log('좌석 데이터 로드 응답:', data);
              console.log('요청한 스케줄 ID:', scheduleId);
            }
            
            if (!data) {
              throw new Error('서버로부터 응답을 받지 못했습니다.');
            }
            
            const seats = Array.isArray(data.seats) ? data.seats : [];
            
            if (seats.length === 0) {
              throw new Error('해당 회차에 좌석 정보가 없습니다. 다른 회차를 선택해주세요.');
            }
            
            const validSeats = seats.filter(seat => 
              seat && 
              typeof seat === 'object' && 
              seat.id && 
              seat.seatNumber && 
              seat.grade && 
              typeof seat.price === 'number'
            );
            
            if (validSeats.length === 0) {
              throw new Error('유효한 좌석 정보가 없습니다.');
            }
            
            actions.loadSeatsSuccess(validSeats);
          })
          .catch(error => {
            const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
            actions.loadSeatsError(errorMessage);
            onError?.(error instanceof Error ? error : new Error(errorMessage));
          });
      };

      loadSeatsAsync();
    }
  }, [scheduleId, state.core.scheduleId, actions, onError]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      // 정리 작업 (폴링 중지)
      actions.stopPolling();
    };
  }, [actions]);

  // 선택 완료 콜백
  useEffect(() => {
    if (state.core.selectedSeats.length > 0) {
      onSelectionComplete?.(state.core.selectedSeats);
    }
  }, [state.core.selectedSeats, onSelectionComplete]);

  // Context 값
  const contextValue: SeatSelectionContextValue = useMemo(() => ({
    state,
    actions: coreActions,
    syncActions,
    uiActions,
    sessionActions,
    selectors,
    utils,
  }), [state, coreActions, syncActions, uiActions, sessionActions, selectors, utils]);

  return (
    <SeatSelectionContext.Provider value={contextValue}>
      {children}
    </SeatSelectionContext.Provider>
  );
};

// Hook for using the context
export const useSeatSelection = () => {
  const context = useContext(SeatSelectionContext);
  
  if (!context) {
    throw new Error('useSeatSelection must be used within a SeatSelectionProvider');
  }
  
  return context;
};

// 타입 export
export type { SeatSelectionContextValue, SeatSelectionProviderProps };
