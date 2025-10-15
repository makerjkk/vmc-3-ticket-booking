// 취소 가능 시간 (공연 시작 전 최소 시간, 분 단위)
export const CANCEL_THRESHOLD_MINUTES = 120; // 2시간

// 취소 불가 사유 메시지
export const CANCEL_REASON_MESSAGES = {
  ALREADY_CANCELLED: '이미 취소된 예약입니다',
  TOO_CLOSE_TO_CONCERT: '공연 시작 2시간 전까지만 취소할 수 있습니다',
  PAST_EVENT: '이미 종료된 공연입니다',
} as const;

// 로딩 메시지
export const LOADING_MESSAGES = {
  FETCHING_RESERVATION: '예약 정보를 불러오는 중...',
  CANCELLING_RESERVATION: '예약을 취소하는 중...',
} as const;

// 성공 메시지
export const SUCCESS_MESSAGES = {
  RESERVATION_CANCELLED: '예약이 성공적으로 취소되었습니다',
} as const;

// 에러 메시지
export const ERROR_MESSAGES = {
  FETCH_FAILED: '예약 정보를 불러오는 중 오류가 발생했습니다',
  CANCEL_FAILED: '예약 취소 중 오류가 발생했습니다',
  RESERVATION_NOT_FOUND: '예약을 찾을 수 없습니다',
  NETWORK_ERROR: '네트워크 오류가 발생했습니다',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다',
} as const;

// 다이얼로그 메시지
export const DIALOG_MESSAGES = {
  CANCEL_TITLE: '예약을 취소하시겠습니까?',
  CANCEL_DESCRIPTION: '이 작업은 되돌릴 수 없습니다.',
  CANCEL_CONFIRM: '확인',
  CANCEL_CANCEL: '취소',
} as const;

// 스켈레톤 로딩 개수
export const SKELETON_COUNTS = {
  INFO_ROWS: 8,
  SEAT_ITEMS: 3,
} as const;

