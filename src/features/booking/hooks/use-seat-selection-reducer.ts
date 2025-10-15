'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type {
  Seat,
  SeatStatus,
  TooltipState,
  AlertState,
  ConnectionStatus,
  BookingProgress,
} from '../lib/dto';

// 좌석 선택 상태 인터페이스 정의
export interface SeatSelectionState {
  // 핵심 상태
  core: {
    selectedSeats: Seat[];
    seatLayoutData: Seat[];
    scheduleId: string;
    isLoading: boolean;
    error: string | null;
  };
  
  // UI 상태
  ui: {
    focusedSeatId: string | null;
    showTooltip: TooltipState | null;
    showAlert: AlertState | null;
    isCompleteButtonEnabled: boolean;
    viewMode: 'grid' | 'list';
  };
  
  // 실시간 동기화 상태
  sync: {
    pollingActive: boolean;
    lastSyncTime: number | null;
    conflictSeats: string[];
    connectionStatus: ConnectionStatus;
    retryCount: number;
  };
  
  // 세션 상태
  session: {
    holdExpiry: number | null;
    sessionId: string;
    lastActivity: number;
    autoSaveEnabled: boolean;
  };
}

// 액션 타입 정의
export type SeatSelectionAction =
  // Core Actions
  | { type: 'LOAD_SEATS_START'; payload: { scheduleId: string } }
  | { type: 'LOAD_SEATS_SUCCESS'; payload: { seats: Seat[] } }
  | { type: 'LOAD_SEATS_ERROR'; payload: { error: string } }
  | { type: 'SELECT_SEAT'; payload: { seat: Seat } }
  | { type: 'DESELECT_SEAT'; payload: { seatId: string } }
  | { type: 'CLEAR_SELECTION' }
  
  // Sync Actions
  | { type: 'SYNC_SEATS_START' }
  | { type: 'SYNC_SEATS_SUCCESS'; payload: { seats: Seat[]; timestamp: number } }
  | { type: 'SYNC_SEATS_ERROR'; payload: { error: string } }
  | { type: 'CONFLICT_DETECTED'; payload: { conflictSeats: string[] } }
  | { type: 'CLEAR_CONFLICTS' }
  | { type: 'CONNECTION_STATUS_CHANGED'; payload: { status: ConnectionStatus } }
  | { type: 'START_POLLING' }
  | { type: 'STOP_POLLING' }
  
  // UI Actions
  | { type: 'SET_FOCUS'; payload: { seatId: string | null } }
  | { type: 'SHOW_TOOLTIP'; payload: TooltipState }
  | { type: 'HIDE_TOOLTIP' }
  | { type: 'SHOW_ALERT'; payload: AlertState }
  | { type: 'HIDE_ALERT' }
  | { type: 'CLEAR_NOTIFICATIONS' }
  | { type: 'SET_VIEW_MODE'; payload: { mode: 'grid' | 'list' } }
  
  // Session Actions
  | { type: 'SET_HOLD_EXPIRY'; payload: { expiry: number } }
  | { type: 'CLEAR_HOLD_EXPIRY' }
  | { type: 'UPDATE_ACTIVITY'; payload: { timestamp: number } }
  | { type: 'RESTORE_SESSION'; payload: { sessionData: Partial<SeatSelectionState> } }
  | { type: 'TOGGLE_AUTO_SAVE'; payload: { enabled: boolean } }
  
  // Error Actions
  | { type: 'SET_ERROR'; payload: { error: string; context?: string } }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RETRY_LAST_ACTION' };

// 초기 상태
const initialState: SeatSelectionState = {
  core: {
    selectedSeats: [],
    seatLayoutData: [],
    scheduleId: '',
    isLoading: false,
    error: null,
  },
  
  ui: {
    focusedSeatId: null,
    showTooltip: null,
    showAlert: null,
    isCompleteButtonEnabled: false,
    viewMode: 'grid',
  },
  
  sync: {
    pollingActive: false,
    lastSyncTime: null,
    conflictSeats: [],
    connectionStatus: {
      status: 'disconnected',
      lastConnected: null,
      retryCount: 0,
    },
    retryCount: 0,
  },
  
  session: {
    holdExpiry: null,
    sessionId: '',
    lastActivity: Date.now(),
    autoSaveEnabled: true,
  },
};

// 리듀서 함수
const seatSelectionReducer = (
  state: SeatSelectionState,
  action: SeatSelectionAction,
): SeatSelectionState => {
  switch (action.type) {
    // Core Actions
    case 'LOAD_SEATS_START':
      return {
        ...state,
        core: {
          ...state.core,
          isLoading: true,
          error: null,
          scheduleId: action.payload.scheduleId,
        },
      };

    case 'LOAD_SEATS_SUCCESS': {
      // 좌석 데이터 안전성 검증
      const seats = Array.isArray(action.payload.seats) ? action.payload.seats : [];
      
      return {
        ...state,
        core: {
          ...state.core,
          isLoading: false,
          seatLayoutData: seats,
          error: null,
        },
        sync: {
          ...state.sync,
          lastSyncTime: Date.now(),
        },
      };
    }

    case 'LOAD_SEATS_ERROR':
      return {
        ...state,
        core: {
          ...state.core,
          isLoading: false,
          error: action.payload.error,
        },
      };

    case 'SELECT_SEAT': {
      const seat = action.payload.seat;
      
      // 이미 선택된 좌석인지 확인
      if (state.core.selectedSeats.some(s => s.id === seat.id)) {
        return state;
      }
      
      // 최대 4석 제한 확인
      if (state.core.selectedSeats.length >= 4) {
        return {
          ...state,
          ui: {
            ...state.ui,
            showAlert: {
              message: '최대 4석까지만 선택할 수 있습니다',
              type: 'warning',
              duration: 3000,
            },
          },
        };
      }

      // 좌석 선택 가능 여부 확인
      if (seat.status !== 'available') {
        return {
          ...state,
          ui: {
            ...state.ui,
            showTooltip: {
              visible: true,
              message: seat.status === 'reserved' 
                ? '이미 예약된 좌석입니다' 
                : '선택할 수 없는 좌석입니다',
              type: 'warning',
            },
          },
        };
      }

      const newSelectedSeats = [...state.core.selectedSeats, seat];
      
      return {
        ...state,
        core: {
          ...state.core,
          selectedSeats: newSelectedSeats,
        },
        ui: {
          ...state.ui,
          isCompleteButtonEnabled: newSelectedSeats.length > 0,
          showTooltip: null,
          showAlert: null,
        },
        session: {
          ...state.session,
          lastActivity: Date.now(),
        },
      };
    }

    case 'DESELECT_SEAT': {
      const newSelectedSeats = state.core.selectedSeats.filter(
        seat => seat.id !== action.payload.seatId
      );
      
      return {
        ...state,
        core: {
          ...state.core,
          selectedSeats: newSelectedSeats,
        },
        ui: {
          ...state.ui,
          isCompleteButtonEnabled: newSelectedSeats.length > 0,
        },
        session: {
          ...state.session,
          lastActivity: Date.now(),
        },
      };
    }

    case 'CLEAR_SELECTION':
      return {
        ...state,
        core: {
          ...state.core,
          selectedSeats: [],
        },
        ui: {
          ...state.ui,
          isCompleteButtonEnabled: false,
        },
        sync: {
          ...state.sync,
          conflictSeats: [],
        },
        session: {
          ...state.session,
          lastActivity: Date.now(),
        },
      };

    // Sync Actions
    case 'SYNC_SEATS_START':
      return {
        ...state,
        sync: {
          ...state.sync,
          connectionStatus: {
            ...state.sync.connectionStatus,
            status: 'connected',
          },
        },
      };

    case 'SYNC_SEATS_SUCCESS': {
      // 좌석 상태 업데이트 - 안전성 검증
      const updatedSeats = Array.isArray(action.payload.seats) ? action.payload.seats : [];
      
      return {
        ...state,
        core: {
          ...state.core,
          seatLayoutData: updatedSeats,
        },
        sync: {
          ...state.sync,
          lastSyncTime: action.payload.timestamp,
          retryCount: 0,
          connectionStatus: {
            ...state.sync.connectionStatus,
            status: 'connected',
            lastConnected: action.payload.timestamp,
            retryCount: 0,
          },
        },
      };
    }

    case 'SYNC_SEATS_ERROR':
      return {
        ...state,
        sync: {
          ...state.sync,
          retryCount: state.sync.retryCount + 1,
          connectionStatus: {
            ...state.sync.connectionStatus,
            status: 'error',
            retryCount: state.sync.retryCount + 1,
          },
        },
      };

    case 'CONFLICT_DETECTED': {
      const conflictSeats = action.payload.conflictSeats;
      
      // 충돌된 좌석들을 선택에서 제거
      const newSelectedSeats = state.core.selectedSeats.filter(
        seat => !conflictSeats.includes(seat.id)
      );
      
      return {
        ...state,
        core: {
          ...state.core,
          selectedSeats: newSelectedSeats,
        },
        ui: {
          ...state.ui,
          isCompleteButtonEnabled: newSelectedSeats.length > 0,
          showAlert: {
            message: `선택하신 좌석 중 ${conflictSeats.length}석이 다른 사용자에게 예약되었습니다`,
            type: 'warning',
            duration: 5000,
          },
        },
        sync: {
          ...state.sync,
          conflictSeats,
        },
      };
    }

    case 'CLEAR_CONFLICTS':
      return {
        ...state,
        sync: {
          ...state.sync,
          conflictSeats: [],
        },
      };

    case 'CONNECTION_STATUS_CHANGED':
      return {
        ...state,
        sync: {
          ...state.sync,
          connectionStatus: action.payload.status,
        },
      };

    case 'START_POLLING':
      return {
        ...state,
        sync: {
          ...state.sync,
          pollingActive: true,
        },
      };

    case 'STOP_POLLING':
      return {
        ...state,
        sync: {
          ...state.sync,
          pollingActive: false,
        },
      };

    // UI Actions
    case 'SET_FOCUS':
      return {
        ...state,
        ui: {
          ...state.ui,
          focusedSeatId: action.payload.seatId,
        },
      };

    case 'SHOW_TOOLTIP':
      return {
        ...state,
        ui: {
          ...state.ui,
          showTooltip: action.payload,
        },
      };

    case 'HIDE_TOOLTIP':
      return {
        ...state,
        ui: {
          ...state.ui,
          showTooltip: null,
        },
      };

    case 'SHOW_ALERT':
      return {
        ...state,
        ui: {
          ...state.ui,
          showAlert: action.payload,
        },
      };

    case 'HIDE_ALERT':
      return {
        ...state,
        ui: {
          ...state.ui,
          showAlert: null,
        },
      };

    case 'CLEAR_NOTIFICATIONS':
      return {
        ...state,
        ui: {
          ...state.ui,
          showTooltip: null,
          showAlert: null,
        },
      };

    case 'SET_VIEW_MODE':
      return {
        ...state,
        ui: {
          ...state.ui,
          viewMode: action.payload.mode,
        },
      };

    // Session Actions
    case 'SET_HOLD_EXPIRY':
      return {
        ...state,
        session: {
          ...state.session,
          holdExpiry: action.payload.expiry,
        },
      };

    case 'CLEAR_HOLD_EXPIRY':
      return {
        ...state,
        session: {
          ...state.session,
          holdExpiry: null,
        },
      };

    case 'UPDATE_ACTIVITY':
      return {
        ...state,
        session: {
          ...state.session,
          lastActivity: action.payload.timestamp,
        },
      };

    case 'RESTORE_SESSION': {
      const sessionData = action.payload.sessionData;
      return {
        ...state,
        ...sessionData,
      };
    }

    case 'TOGGLE_AUTO_SAVE':
      return {
        ...state,
        session: {
          ...state.session,
          autoSaveEnabled: action.payload.enabled,
        },
      };

    // Error Actions
    case 'SET_ERROR':
      return {
        ...state,
        core: {
          ...state.core,
          error: action.payload.error,
        },
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        core: {
          ...state.core,
          error: null,
        },
      };

    case 'RETRY_LAST_ACTION':
      return {
        ...state,
        core: {
          ...state.core,
          error: null,
        },
        sync: {
          ...state.sync,
          retryCount: 0,
        },
      };

    default:
      return state;
  }
};

// 커스텀 훅
export const useSeatSelectionReducer = () => {
  const [state, dispatch] = useReducer(seatSelectionReducer, initialState);

  // Action Creators (메모이제이션으로 최적화)
  const actions = useMemo(() => ({
    // Core Actions
    loadSeatsStart: (scheduleId: string) => {
      dispatch({ type: 'LOAD_SEATS_START', payload: { scheduleId } });
    },

    loadSeatsSuccess: (seats: Seat[]) => {
      dispatch({ type: 'LOAD_SEATS_SUCCESS', payload: { seats } });
    },

    loadSeatsError: (error: string) => {
      dispatch({ type: 'LOAD_SEATS_ERROR', payload: { error } });
    },

    selectSeat: (seat: Seat) => {
      dispatch({ type: 'SELECT_SEAT', payload: { seat } });
    },

    deselectSeat: (seatId: string) => {
      dispatch({ type: 'DESELECT_SEAT', payload: { seatId } });
    },

    clearSelection: () => {
      dispatch({ type: 'CLEAR_SELECTION' });
    },

    // Sync Actions
    syncSeatsStart: () => {
      dispatch({ type: 'SYNC_SEATS_START' });
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

    clearConflicts: () => {
      dispatch({ type: 'CLEAR_CONFLICTS' });
    },

    connectionStatusChanged: (status: ConnectionStatus) => {
      dispatch({ type: 'CONNECTION_STATUS_CHANGED', payload: { status } });
    },

    startPolling: () => {
      dispatch({ type: 'START_POLLING' });
    },

    stopPolling: () => {
      dispatch({ type: 'STOP_POLLING' });
    },

    // UI Actions
    setFocus: (seatId: string | null) => {
      dispatch({ type: 'SET_FOCUS', payload: { seatId } });
    },

    showTooltip: (tooltip: TooltipState) => {
      dispatch({ type: 'SHOW_TOOLTIP', payload: tooltip });
    },

    hideTooltip: () => {
      dispatch({ type: 'HIDE_TOOLTIP' });
    },

    showAlert: (alert: AlertState) => {
      dispatch({ type: 'SHOW_ALERT', payload: alert });
    },

    hideAlert: () => {
      dispatch({ type: 'HIDE_ALERT' });
    },

    clearNotifications: () => {
      dispatch({ type: 'CLEAR_NOTIFICATIONS' });
    },

    setViewMode: (mode: 'grid' | 'list') => {
      dispatch({ type: 'SET_VIEW_MODE', payload: { mode } });
    },

    // Session Actions
    setHoldExpiry: (expiry: number) => {
      dispatch({ type: 'SET_HOLD_EXPIRY', payload: { expiry } });
    },

    clearHoldExpiry: () => {
      dispatch({ type: 'CLEAR_HOLD_EXPIRY' });
    },

    updateActivity: (timestamp: number) => {
      dispatch({ type: 'UPDATE_ACTIVITY', payload: { timestamp } });
    },

    restoreSession: (sessionData: Partial<SeatSelectionState>) => {
      dispatch({ type: 'RESTORE_SESSION', payload: { sessionData } });
    },

    toggleAutoSave: (enabled: boolean) => {
      dispatch({ type: 'TOGGLE_AUTO_SAVE', payload: { enabled } });
    },

    // Error Actions
    setError: (error: string, context?: string) => {
      dispatch({ type: 'SET_ERROR', payload: { error, context } });
    },

    clearError: () => {
      dispatch({ type: 'CLEAR_ERROR' });
    },

    retryLastAction: () => {
      dispatch({ type: 'RETRY_LAST_ACTION' });
    },
  }), []);

  // Selectors (계산된 값들)
  const selectors = useMemo(() => {
    // 안전한 배열 접근을 위한 기본값 설정
    const selectedSeats = state.core.selectedSeats || [];
    const seatLayoutData = state.core.seatLayoutData || [];
    const conflictSeats = state.sync.conflictSeats || [];
    
    return {
      totalPrice: selectedSeats.reduce((total, seat) => total + (seat?.price || 0), 0),
      selectedSeatCount: selectedSeats.length,
      availableSeatCount: seatLayoutData.filter(seat => seat?.status === 'available').length,
      isMaxSeatsSelected: selectedSeats.length >= 4,
      canCompleteSelection: selectedSeats.length > 0 && selectedSeats.length <= 4,
      conflictSeatNumbers: conflictSeats.map(seatId => {
        const seat = seatLayoutData.find(s => s?.id === seatId);
        return seat ? seat.seatNumber : seatId;
      }),
      holdTimeRemaining: state.session.holdExpiry ? Math.max(0, state.session.holdExpiry - Date.now()) : null,
    };
  }, [state]);

  return { state, actions, selectors, dispatch };
};
