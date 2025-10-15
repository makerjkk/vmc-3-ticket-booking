export const SEARCH_CONSTANTS = {
  ITEMS_PER_PAGE: 10,
  MAX_SEARCH_RESULTS: 100,
  DEBOUNCE_DELAY: 300,
} as const;

export const VALIDATION_MESSAGES = {
  INVALID_RESERVATION_ID: '올바른 예약 번호 형식이 아닙니다',
  INVALID_PHONE: '올바른 휴대폰 번호 형식을 입력해주세요 (예: 010-1234-5678)',
  INVALID_EMAIL: '올바른 이메일 형식을 입력해주세요',
  NO_SEARCH_CRITERIA: '예약 번호 또는 연락처를 입력해주세요',
  SEARCH_FAILED: '검색 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요',
} as const;

export const PLACEHOLDERS = {
  RESERVATION_ID: '예: R2510150002 (선택)',
  CONTACT: '예: 010-1234-5678 또는 email@example.com (선택)',
} as const;

export const EMPTY_STATE_MESSAGES = {
  TITLE: '검색 결과가 없습니다',
  DESCRIPTION: '예약 번호 또는 예약 시 입력한 연락처를 다시 확인해주세요',
} as const;

export const ERROR_MESSAGES = {
  RESERVATION_NOT_FOUND: '잘못된 예약번호이거나 예약되지 않은 번호입니다',
  PHONE_NOT_FOUND: '예약되지 않은 전화번호입니다',
  EMAIL_NOT_FOUND: '예약되지 않은 이메일입니다',
  CONTACT_NOT_FOUND: '예약되지 않은 연락처입니다',
} as const;

