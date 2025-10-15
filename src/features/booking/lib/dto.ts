// 백엔드 스키마 재노출 - 클라이언트에서 사용할 타입들
export {
  // 요청/응답 타입
  type ScheduleListRequest,
  type ScheduleListResponse,
  type ScheduleDetailRequest,
  type SeatLayoutResponse,
  type SeatCountUpdate,
  type ScheduleAvailability,
  
  // 데이터 타입
  type ScheduleItem,
  type SeatData,
  
  // 스키마 (클라이언트 측 검증용)
  ScheduleListRequestSchema,
  ScheduleListResponseSchema,
  ScheduleDetailRequestSchema,
  SeatLayoutResponseSchema,
  SeatCountUpdateSchema,
  ScheduleAvailabilitySchema,
  ScheduleItemSchema,
  SeatDataSchema,
} from '../backend/schema';

// 에러 관련 재노출
export {
  scheduleErrorCodes,
  scheduleErrorMessages,
  getScheduleErrorMessage,
  type ScheduleServiceError,
} from '../backend/error';

// 클라이언트 전용 타입 정의
export interface TooltipState {
  visible: boolean;
  message: string;
  type: 'info' | 'warning' | 'error';
  position?: {
    x: number;
    y: number;
  };
}

export interface SelectedSeatInfo {
  seatId: string;
  seatNumber: string;
  grade: 'R' | 'S' | 'A';
  price: number;
}

export interface BookingProgress {
  currentStep: 'date' | 'schedule' | 'seat' | 'payment' | 'complete';
  completedSteps: string[];
  totalSteps: number;
}

export interface SessionData {
  concertId: string;
  selectedDate: string | null;
  selectedScheduleId: string | null;
  selectedSeats: string[];
  timestamp: number;
  expiresAt: number;
}

// 유틸리티 타입
export type ScheduleStatus = 'available' | 'sold-out' | 'almost-sold-out' | 'expired';
export type SeatStatus = 'available' | 'reserved' | 'selected' | 'held' | 'conflict';

// 좌석 선택 관련 타입
export interface Seat {
  id: string;
  seatNumber: string;
  rowName: string;
  seatIndex: number;
  grade: 'R' | 'S' | 'A';
  price: number;
  status: 'available' | 'reserved' | 'held';
  xPosition: number;
  yPosition: number;
  metadata?: {
    isAccessible?: boolean;
    hasObstruction?: boolean;
    sightlineRating?: number;
  };
}

export interface SeatRow {
  rowName: string;
  seats: Seat[];
}

export interface AlertState {
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  duration?: number;
  actionable?: boolean;
}

export interface ConnectionStatus {
  status: 'connected' | 'disconnected' | 'error';
  lastConnected?: number;
  retryCount?: number;
}

// API 응답 래퍼 타입 (React Query용)
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

// 폴링 관련 타입
export interface PollingConfig {
  interval: number; // 밀리초
  maxRetries: number;
  backoffMultiplier: number;
  enabled: boolean;
}

// 실시간 업데이트 이벤트 타입
export interface RealTimeEvent {
  type: 'seat_count_update' | 'schedule_sold_out' | 'seat_reserved' | 'seat_released';
  scheduleId: string;
  data: unknown;
  timestamp: string;
}
