import { VALIDATION_MESSAGES } from '../constants/search';

export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export const isValidReservationNumber = (value: string): boolean => {
  // 예약 번호 형식: R + 10자리 숫자 (예: R2510150002)
  const reservationNumberRegex = /^R\d{10}$/;
  return reservationNumberRegex.test(value);
};

export const isValidPhone = (value: string): boolean => {
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  return phoneRegex.test(value);
};

export const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const validateReservationId = (value: string, isRequired: boolean = false): string | null => {
  if (!value) {
    return isRequired ? VALIDATION_MESSAGES.NO_SEARCH_CRITERIA : null;
  }
  // UUID 또는 예약 번호 형식 모두 허용
  if (!isValidUUID(value) && !isValidReservationNumber(value)) {
    return VALIDATION_MESSAGES.INVALID_RESERVATION_ID;
  }
  return null;
};

export const validateContact = (value: string, isRequired: boolean = false): string | null => {
  if (!value) {
    return isRequired ? VALIDATION_MESSAGES.NO_SEARCH_CRITERIA : null;
  }
  if (!isValidPhone(value) && !isValidEmail(value)) {
    return VALIDATION_MESSAGES.INVALID_EMAIL;
  }
  return null;
};

export const hasSearchCriteria = (reservationId: string, contact: string): boolean => {
  return Boolean(reservationId || contact);
};

