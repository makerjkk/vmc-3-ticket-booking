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
  RESERVATION_ID: '예약 번호를 입력하세요',
  CONTACT: '휴대폰 번호 또는 이메일을 입력하세요',
} as const;

export const EMPTY_STATE_MESSAGES = {
  TITLE: '검색 결과가 없습니다',
  DESCRIPTION: '예약 번호 또는 예약 시 입력한 연락처를 다시 확인해주세요',
} as const;

