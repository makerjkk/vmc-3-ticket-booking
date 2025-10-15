/**
 * 예약 완료 페이지 상태 타입 정의
 */

/**
 * 예약 상세 정보
 */
export interface ReservationDetail {
  reservationId: string;
  reservationNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  status: 'confirmed' | 'cancelled';
  createdAt: string;
  cancelledAt?: string | null;
  concert: {
    id: string;
    title: string;
    posterImageUrl: string;
  };
  schedule: {
    id: string;
    dateTime: string;
  };
  seats: Array<{
    seatNumber: string;
    grade: string;
    price: number;
  }>;
  seatCount: number;
  totalPrice: number;
}

/**
 * 에러 정보
 */
export interface ErrorInfo {
  code: 'NOT_FOUND' | 'SERVER_ERROR' | 'NETWORK_ERROR' | 'INVALID_ID' | 'MISSING_ID';
  message: string;
  retryable: boolean;
}

/**
 * 전체 상태
 */
export interface BookingSuccessState {
  loadingState: 'idle' | 'loading' | 'success' | 'error';
  isRetrying: boolean;
  reservationData: ReservationDetail | null;
  error: ErrorInfo | null;
  isPriceDetailExpanded: boolean;
  isNavigating: boolean;
}

