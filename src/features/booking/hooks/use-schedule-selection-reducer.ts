'use client';

import { useReducer, useCallback, useMemo } from 'react';
import type {
  ScheduleItem,
  SeatData,
  TooltipState,
  SelectedSeatInfo,
  BookingProgress,
} from '../lib/dto';

// 상태 인터페이스 정의
export interface ScheduleSelectionState {
  // 기본 선택 상태
  selectedDate: string | null;
  selectedScheduleId: string | null;
  schedules: ScheduleItem[] | null;
  seats: SeatData[] | null;
  
  // 로딩 상태
  isSchedulesLoading: boolean;
  isSeatsLoading: boolean;
  isSeatCountLoading: boolean;
  
  // 에러 상태
  schedulesError: Error | null;
  seatsError: Error | null;
  seatCountError: Error | null;
  
  // 실시간 업데이트 상태
  pollingInterval: NodeJS.Timeout | null;
  lastUpdated: Date | null;
  isPollingActive: boolean;
  retryCount: number;
  
  // UI 상태
  tooltipState: TooltipState | null;
  selectedSeats: string[];
  totalPrice: number;
  bookingProgress: BookingProgress;
  
  // 네트워크 상태
  isOffline: boolean;
}

// 액션 타입 정의
export type ScheduleSelectionAction =
  | { type: 'SELECT_DATE'; payload: string }
  | { type: 'SELECT_SCHEDULE'; payload: string }
  | { type: 'LOAD_SCHEDULES_START' }
  | { type: 'LOAD_SCHEDULES_SUCCESS'; payload: ScheduleItem[] }
  | { type: 'LOAD_SCHEDULES_FAILURE'; payload: Error }
  | { type: 'LOAD_SEATS_START' }
  | { type: 'LOAD_SEATS_SUCCESS'; payload: SeatData[] }
  | { type: 'LOAD_SEATS_FAILURE'; payload: Error }
  | { type: 'UPDATE_SEAT_COUNT_START' }
  | { type: 'UPDATE_SEAT_COUNT_SUCCESS'; payload: { scheduleId: string; availableSeats: number; totalSeats: number } }
  | { type: 'UPDATE_SEAT_COUNT_FAILURE'; payload: Error }
  | { type: 'START_POLLING'; payload: NodeJS.Timeout }
  | { type: 'STOP_POLLING' }
  | { type: 'INCREMENT_RETRY_COUNT' }
  | { type: 'RESET_RETRY_COUNT' }
  | { type: 'SHOW_TOOLTIP'; payload: TooltipState }
  | { type: 'HIDE_TOOLTIP' }
  | { type: 'SELECT_SEAT'; payload: string }
  | { type: 'DESELECT_SEAT'; payload: string }
  | { type: 'CLEAR_SELECTED_SEATS' }
  | { type: 'UPDATE_TOTAL_PRICE'; payload: number }
  | { type: 'UPDATE_BOOKING_PROGRESS'; payload: Partial<BookingProgress> }
  | { type: 'SET_OFFLINE_STATUS'; payload: boolean }
  | { type: 'RESET_STATE' };

// 초기 상태
const initialState: ScheduleSelectionState = {
  selectedDate: null,
  selectedScheduleId: null,
  schedules: null,
  seats: null,
  
  isSchedulesLoading: false,
  isSeatsLoading: false,
  isSeatCountLoading: false,
  
  schedulesError: null,
  seatsError: null,
  seatCountError: null,
  
  pollingInterval: null,
  lastUpdated: null,
  isPollingActive: false,
  retryCount: 0,
  
  tooltipState: null,
  selectedSeats: [],
  totalPrice: 0,
  bookingProgress: {
    currentStep: 'date',
    completedSteps: [],
    totalSteps: 4,
  },
  
  isOffline: false,
};

// 리듀서 함수
const scheduleSelectionReducer = (
  state: ScheduleSelectionState,
  action: ScheduleSelectionAction,
): ScheduleSelectionState => {
  switch (action.type) {
    case 'SELECT_DATE':
      return {
        ...state,
        selectedDate: action.payload,
        selectedScheduleId: null,
        schedules: null,
        seats: null,
        selectedSeats: [],
        totalPrice: 0,
        schedulesError: null,
        seatsError: null,
        bookingProgress: {
          ...state.bookingProgress,
          currentStep: 'schedule',
          completedSteps: ['date'],
        },
      };

    case 'SELECT_SCHEDULE':
      return {
        ...state,
        selectedScheduleId: action.payload,
        seats: null,
        selectedSeats: [],
        totalPrice: 0,
        seatsError: null,
        bookingProgress: {
          ...state.bookingProgress,
          currentStep: 'seat',
          completedSteps: ['date', 'schedule'],
        },
      };

    case 'LOAD_SCHEDULES_START':
      return {
        ...state,
        isSchedulesLoading: true,
        schedulesError: null,
      };

    case 'LOAD_SCHEDULES_SUCCESS':
      return {
        ...state,
        isSchedulesLoading: false,
        schedules: action.payload,
        schedulesError: null,
        lastUpdated: new Date(),
      };

    case 'LOAD_SCHEDULES_FAILURE':
      return {
        ...state,
        isSchedulesLoading: false,
        schedulesError: action.payload,
        schedules: null,
      };

    case 'LOAD_SEATS_START':
      return {
        ...state,
        isSeatsLoading: true,
        seatsError: null,
      };

    case 'LOAD_SEATS_SUCCESS':
      return {
        ...state,
        isSeatsLoading: false,
        seats: action.payload,
        seatsError: null,
        lastUpdated: new Date(),
      };

    case 'LOAD_SEATS_FAILURE':
      return {
        ...state,
        isSeatsLoading: false,
        seatsError: action.payload,
        seats: null,
      };

    case 'UPDATE_SEAT_COUNT_START':
      return {
        ...state,
        isSeatCountLoading: true,
        seatCountError: null,
      };

    case 'UPDATE_SEAT_COUNT_SUCCESS':
      // 현재 스케줄의 좌석 수 업데이트
      const updatedSchedules = state.schedules?.map(schedule => 
        schedule.id === action.payload.scheduleId
          ? {
              ...schedule,
              availableSeats: action.payload.availableSeats,
              totalSeats: action.payload.totalSeats,
              isSoldOut: action.payload.availableSeats === 0,
              isAlmostSoldOut: action.payload.availableSeats > 0 && action.payload.availableSeats <= 10,
            }
          : schedule
      ) || null;

      return {
        ...state,
        isSeatCountLoading: false,
        schedules: updatedSchedules,
        seatCountError: null,
        lastUpdated: new Date(),
      };

    case 'UPDATE_SEAT_COUNT_FAILURE':
      return {
        ...state,
        isSeatCountLoading: false,
        seatCountError: action.payload,
      };

    case 'START_POLLING':
      return {
        ...state,
        pollingInterval: action.payload,
        isPollingActive: true,
      };

    case 'STOP_POLLING':
      if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
      }
      return {
        ...state,
        pollingInterval: null,
        isPollingActive: false,
      };

    case 'INCREMENT_RETRY_COUNT':
      return {
        ...state,
        retryCount: state.retryCount + 1,
      };

    case 'RESET_RETRY_COUNT':
      return {
        ...state,
        retryCount: 0,
      };

    case 'SHOW_TOOLTIP':
      return {
        ...state,
        tooltipState: action.payload,
      };

    case 'HIDE_TOOLTIP':
      return {
        ...state,
        tooltipState: null,
      };

    case 'SELECT_SEAT':
      if (state.selectedSeats.includes(action.payload)) {
        return state; // 이미 선택된 좌석
      }
      
      // 최대 4석 제한
      if (state.selectedSeats.length >= 4) {
        return {
          ...state,
          tooltipState: {
            visible: true,
            message: '최대 4석까지만 선택할 수 있습니다',
            type: 'warning',
          },
        };
      }

      return {
        ...state,
        selectedSeats: [...state.selectedSeats, action.payload],
        tooltipState: null,
      };

    case 'DESELECT_SEAT':
      return {
        ...state,
        selectedSeats: state.selectedSeats.filter(seatId => seatId !== action.payload),
      };

    case 'CLEAR_SELECTED_SEATS':
      return {
        ...state,
        selectedSeats: [],
        totalPrice: 0,
      };

    case 'UPDATE_TOTAL_PRICE':
      return {
        ...state,
        totalPrice: action.payload,
      };

    case 'UPDATE_BOOKING_PROGRESS':
      return {
        ...state,
        bookingProgress: {
          ...state.bookingProgress,
          ...action.payload,
        },
      };

    case 'SET_OFFLINE_STATUS':
      return {
        ...state,
        isOffline: action.payload,
      };

    case 'RESET_STATE':
      // 폴링 정리
      if (state.pollingInterval) {
        clearInterval(state.pollingInterval);
      }
      return initialState;

    default:
      return state;
  }
};

// 커스텀 훅
export const useScheduleSelectionReducer = () => {
  const [state, dispatch] = useReducer(scheduleSelectionReducer, initialState);

  // 액션 생성자들
  const selectDate = useCallback((date: string) => {
    dispatch({ type: 'SELECT_DATE', payload: date });
  }, []);

  const selectSchedule = useCallback((scheduleId: string) => {
    dispatch({ type: 'SELECT_SCHEDULE', payload: scheduleId });
  }, []);

  const loadSchedulesStart = useCallback(() => {
    dispatch({ type: 'LOAD_SCHEDULES_START' });
  }, []);

  const loadSchedulesSuccess = useCallback((schedules: ScheduleItem[]) => {
    dispatch({ type: 'LOAD_SCHEDULES_SUCCESS', payload: schedules });
  }, []);

  const loadSchedulesFailure = useCallback((error: Error) => {
    dispatch({ type: 'LOAD_SCHEDULES_FAILURE', payload: error });
  }, []);

  const loadSeatsStart = useCallback(() => {
    dispatch({ type: 'LOAD_SEATS_START' });
  }, []);

  const loadSeatsSuccess = useCallback((seats: SeatData[]) => {
    dispatch({ type: 'LOAD_SEATS_SUCCESS', payload: seats });
  }, []);

  const loadSeatsFailure = useCallback((error: Error) => {
    dispatch({ type: 'LOAD_SEATS_FAILURE', payload: error });
  }, []);

  const updateSeatCountStart = useCallback(() => {
    dispatch({ type: 'UPDATE_SEAT_COUNT_START' });
  }, []);

  const updateSeatCountSuccess = useCallback((data: { scheduleId: string; availableSeats: number; totalSeats: number }) => {
    dispatch({ type: 'UPDATE_SEAT_COUNT_SUCCESS', payload: data });
  }, []);

  const updateSeatCountFailure = useCallback((error: Error) => {
    dispatch({ type: 'UPDATE_SEAT_COUNT_FAILURE', payload: error });
  }, []);

  const startPolling = useCallback((interval: NodeJS.Timeout) => {
    dispatch({ type: 'START_POLLING', payload: interval });
  }, []);

  const stopPolling = useCallback(() => {
    dispatch({ type: 'STOP_POLLING' });
  }, []);

  const incrementRetryCount = useCallback(() => {
    dispatch({ type: 'INCREMENT_RETRY_COUNT' });
  }, []);

  const resetRetryCount = useCallback(() => {
    dispatch({ type: 'RESET_RETRY_COUNT' });
  }, []);

  const showTooltip = useCallback((tooltip: TooltipState) => {
    dispatch({ type: 'SHOW_TOOLTIP', payload: tooltip });
  }, []);

  const hideTooltip = useCallback(() => {
    dispatch({ type: 'HIDE_TOOLTIP' });
  }, []);

  const selectSeat = useCallback((seatId: string) => {
    dispatch({ type: 'SELECT_SEAT', payload: seatId });
  }, []);

  const deselectSeat = useCallback((seatId: string) => {
    dispatch({ type: 'DESELECT_SEAT', payload: seatId });
  }, []);

  const clearSelectedSeats = useCallback(() => {
    dispatch({ type: 'CLEAR_SELECTED_SEATS' });
  }, []);

  const updateTotalPrice = useCallback((price: number) => {
    dispatch({ type: 'UPDATE_TOTAL_PRICE', payload: price });
  }, []);

  const updateBookingProgress = useCallback((progress: Partial<BookingProgress>) => {
    dispatch({ type: 'UPDATE_BOOKING_PROGRESS', payload: progress });
  }, []);

  const setOfflineStatus = useCallback((isOffline: boolean) => {
    dispatch({ type: 'SET_OFFLINE_STATUS', payload: isOffline });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const actions = useMemo(() => ({
    selectDate,
    selectSchedule,
    loadSchedulesStart,
    loadSchedulesSuccess,
    loadSchedulesFailure,
    loadSeatsStart,
    loadSeatsSuccess,
    loadSeatsFailure,
    updateSeatCountStart,
    updateSeatCountSuccess,
    updateSeatCountFailure,
    startPolling,
    stopPolling,
    incrementRetryCount,
    resetRetryCount,
    showTooltip,
    hideTooltip,
    selectSeat,
    deselectSeat,
    clearSelectedSeats,
    updateTotalPrice,
    updateBookingProgress,
    setOfflineStatus,
    resetState,
  }), [
    selectDate,
    selectSchedule,
    loadSchedulesStart,
    loadSchedulesSuccess,
    loadSchedulesFailure,
    loadSeatsStart,
    loadSeatsSuccess,
    loadSeatsFailure,
    updateSeatCountStart,
    updateSeatCountSuccess,
    updateSeatCountFailure,
    startPolling,
    stopPolling,
    incrementRetryCount,
    resetRetryCount,
    showTooltip,
    hideTooltip,
    selectSeat,
    deselectSeat,
    clearSelectedSeats,
    updateTotalPrice,
    updateBookingProgress,
    setOfflineStatus,
    resetState,
  ]);

  return { state, actions };
};
