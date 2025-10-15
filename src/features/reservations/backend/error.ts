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
    default:
      return 500;
  }
};

