// Backend 스키마 재노출
export type {
  ValidateSeatsRequest,
  ValidateSeatsResponse,
  CreateReservationRequest,
  CreateReservationResponse,
  ReservationDetailResponse,
} from '../backend/schema';

// Backend 에러 코드 재노출
export { reservationErrorCodes } from '../backend/error';
export type { ReservationServiceError } from '../backend/error';

