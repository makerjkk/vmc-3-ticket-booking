// 회차 선택 관련 에러 코드 정의
export const scheduleErrorCodes = {
  // 회차 관련 에러
  scheduleNotFound: 'SCHEDULE_NOT_FOUND',
  scheduleSoldOut: 'SCHEDULE_SOLD_OUT',
  scheduleExpired: 'SCHEDULE_EXPIRED',
  invalidScheduleId: 'INVALID_SCHEDULE_ID',
  
  // 좌석 관련 에러
  seatDataLoadFailed: 'SEAT_DATA_LOAD_FAILED',
  seatNotFound: 'SEAT_NOT_FOUND',
  seatAlreadyReserved: 'SEAT_ALREADY_RESERVED',
  seatConflict: 'SEAT_CONFLICT',
  seatHoldFailed: 'SEAT_HOLD_FAILED',
  seatReleaseFailed: 'SEAT_RELEASE_FAILED',
  seatHoldExpired: 'SEAT_HOLD_EXPIRED',
  maxSeatsExceeded: 'MAX_SEATS_EXCEEDED',
  seatNotAvailable: 'SEAT_NOT_AVAILABLE',
  
  // 날짜/시간 관련 에러
  invalidDateRange: 'INVALID_DATE_RANGE',
  pastDateSelected: 'PAST_DATE_SELECTED',
  noSchedulesAvailable: 'NO_SCHEDULES_AVAILABLE',
  
  // 실시간 업데이트 에러
  realTimeUpdateFailed: 'REAL_TIME_UPDATE_FAILED',
  pollingError: 'POLLING_ERROR',
  websocketConnectionFailed: 'WEBSOCKET_CONNECTION_FAILED',
  
  // 데이터베이스 에러
  databaseError: 'DATABASE_ERROR',
  queryError: 'QUERY_ERROR',
  connectionError: 'CONNECTION_ERROR',
  
  // 검증 에러
  validationError: 'VALIDATION_ERROR',
  schemaValidationFailed: 'SCHEMA_VALIDATION_FAILED',
  
  // 시스템 에러
  cleanupFailed: 'CLEANUP_FAILED',
  transactionFailed: 'TRANSACTION_FAILED',
  concurrencyError: 'CONCURRENCY_ERROR',
  
  // 일반 에러
  fetchError: 'FETCH_ERROR',
  networkError: 'NETWORK_ERROR',
  serverError: 'SERVER_ERROR',
  unknownError: 'UNKNOWN_ERROR',
} as const;

// 에러 메시지 매핑
export const scheduleErrorMessages = {
  [scheduleErrorCodes.scheduleNotFound]: '회차를 찾을 수 없습니다',
  [scheduleErrorCodes.scheduleSoldOut]: '선택하신 회차가 매진되었습니다',
  [scheduleErrorCodes.scheduleExpired]: '선택하신 회차의 예매 시간이 지났습니다',
  [scheduleErrorCodes.invalidScheduleId]: '유효하지 않은 회차 ID입니다',
  
  [scheduleErrorCodes.seatDataLoadFailed]: '좌석 정보를 불러올 수 없습니다',
  [scheduleErrorCodes.seatNotFound]: '좌석을 찾을 수 없습니다',
  [scheduleErrorCodes.seatAlreadyReserved]: '이미 예약된 좌석입니다',
  [scheduleErrorCodes.seatConflict]: '선택하신 좌석 중 일부가 다른 사용자에게 예약되었습니다',
  [scheduleErrorCodes.seatHoldFailed]: '좌석 임시 예약에 실패했습니다',
  [scheduleErrorCodes.seatReleaseFailed]: '좌석 예약 해제에 실패했습니다',
  [scheduleErrorCodes.seatHoldExpired]: '좌석 임시 예약이 만료되었습니다',
  [scheduleErrorCodes.maxSeatsExceeded]: '최대 4석까지만 선택할 수 있습니다',
  [scheduleErrorCodes.seatNotAvailable]: '선택할 수 없는 좌석입니다',
  
  [scheduleErrorCodes.invalidDateRange]: '유효하지 않은 날짜 범위입니다',
  [scheduleErrorCodes.pastDateSelected]: '과거 날짜는 선택할 수 없습니다',
  [scheduleErrorCodes.noSchedulesAvailable]: '해당 날짜에 예매 가능한 회차가 없습니다',
  
  [scheduleErrorCodes.realTimeUpdateFailed]: '실시간 업데이트에 실패했습니다',
  [scheduleErrorCodes.pollingError]: '좌석 정보 업데이트 중 오류가 발생했습니다',
  [scheduleErrorCodes.websocketConnectionFailed]: '실시간 연결에 실패했습니다',
  
  [scheduleErrorCodes.databaseError]: '데이터베이스 오류가 발생했습니다',
  [scheduleErrorCodes.queryError]: '데이터 조회 중 오류가 발생했습니다',
  [scheduleErrorCodes.connectionError]: '데이터베이스 연결에 실패했습니다',
  
  [scheduleErrorCodes.validationError]: '입력 데이터가 유효하지 않습니다',
  [scheduleErrorCodes.schemaValidationFailed]: '데이터 형식이 올바르지 않습니다',
  
  [scheduleErrorCodes.cleanupFailed]: '시스템 정리 작업에 실패했습니다',
  [scheduleErrorCodes.transactionFailed]: '트랜잭션 처리에 실패했습니다',
  [scheduleErrorCodes.concurrencyError]: '동시 접근으로 인한 오류가 발생했습니다',
  
  [scheduleErrorCodes.fetchError]: '데이터를 불러오는 중 오류가 발생했습니다',
  [scheduleErrorCodes.networkError]: '네트워크 연결을 확인해주세요',
  [scheduleErrorCodes.serverError]: '서버 오류가 발생했습니다',
  [scheduleErrorCodes.unknownError]: '알 수 없는 오류가 발생했습니다',
} as const;

// 에러 타입 정의
export type ScheduleServiceError = typeof scheduleErrorCodes[keyof typeof scheduleErrorCodes];

// 에러 메시지 가져오기 유틸리티 함수
export const getScheduleErrorMessage = (errorCode: ScheduleServiceError): string => {
  return scheduleErrorMessages[errorCode] || scheduleErrorMessages[scheduleErrorCodes.unknownError];
};

// HTTP 상태 코드 매핑
export const getScheduleErrorHttpStatus = (errorCode: ScheduleServiceError): number => {
  switch (errorCode) {
    case 'SCHEDULE_NOT_FOUND':
    case 'SEAT_NOT_FOUND':
      return 404;
    
    case 'VALIDATION_ERROR':
    case 'SCHEMA_VALIDATION_FAILED':
    case 'INVALID_SCHEDULE_ID':
    case 'INVALID_DATE_RANGE':
    case 'PAST_DATE_SELECTED':
      return 400;
    
    case 'SCHEDULE_SOLD_OUT':
    case 'SEAT_ALREADY_RESERVED':
    case 'SCHEDULE_EXPIRED':
    case 'SEAT_CONFLICT':
    case 'SEAT_HOLD_EXPIRED':
    case 'CONCURRENCY_ERROR':
      return 409; // Conflict
    
    case 'DATABASE_ERROR':
    case 'QUERY_ERROR':
    case 'CONNECTION_ERROR':
    case 'SERVER_ERROR':
      return 500;
    
    case 'NETWORK_ERROR':
    case 'FETCH_ERROR':
      return 503; // Service Unavailable
    
    default:
      return 500;
  }
};
