// 예약 관련 에러 코드
export const reservationErrorCodes = {
  validationError: 'VALIDATION_ERROR',
  seatValidationError: 'SEAT_VALIDATION_ERROR',
  seatsNotAvailable: 'SEATS_NOT_AVAILABLE',
  duplicateReservation: 'DUPLICATE_RESERVATION',
  reservationNotFound: 'RESERVATION_NOT_FOUND',
  reservationCreationError: 'RESERVATION_CREATION_ERROR',
  duplicateCheckError: 'DUPLICATE_CHECK_ERROR',
  seatFetchError: 'SEAT_FETCH_ERROR',
  internalError: 'INTERNAL_ERROR',
  invalidJson: 'INVALID_JSON',
  networkError: 'NETWORK_ERROR',
  searchError: 'SEARCH_ERROR',
  invalidSearchCriteria: 'INVALID_SEARCH_CRITERIA',
  alreadyCancelled: 'ALREADY_CANCELLED',
  cannotCancelTooClose: 'CANNOT_CANCEL_TOO_CLOSE',
  cannotCancelPastEvent: 'CANNOT_CANCEL_PAST_EVENT',
  cancellationFailed: 'CANCELLATION_FAILED',
} as const;

export type ReservationServiceError =
  (typeof reservationErrorCodes)[keyof typeof reservationErrorCodes];

// HTTP 상태 코드 매핑
export const getReservationErrorHttpStatus = (
  errorCode: ReservationServiceError
): number => {
  switch (errorCode) {
    case reservationErrorCodes.validationError:
    case reservationErrorCodes.invalidJson:
    case reservationErrorCodes.alreadyCancelled:
    case reservationErrorCodes.cannotCancelTooClose:
    case reservationErrorCodes.cannotCancelPastEvent:
      return 400;
    case reservationErrorCodes.reservationNotFound:
      return 404;
    case reservationErrorCodes.seatsNotAvailable:
    case reservationErrorCodes.duplicateReservation:
      return 409;
    case reservationErrorCodes.seatValidationError:
    case reservationErrorCodes.reservationCreationError:
    case reservationErrorCodes.duplicateCheckError:
    case reservationErrorCodes.seatFetchError:
    case reservationErrorCodes.internalError:
    case reservationErrorCodes.networkError:
    case reservationErrorCodes.searchError:
    case reservationErrorCodes.invalidSearchCriteria:
    case reservationErrorCodes.cancellationFailed:
    default:
      return 500;
  }
};

