import { VALIDATION_MESSAGES } from '../constants/search';

export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

export const isValidPhone = (value: string): boolean => {
  const phoneRegex = /^010-\d{4}-\d{4}$/;
  return phoneRegex.test(value);
};

export const isValidEmail = (value: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(value);
};

export const validateReservationId = (value: string): string | null => {
  if (!value) return null;
  if (!isValidUUID(value)) {
    return VALIDATION_MESSAGES.INVALID_RESERVATION_ID;
  }
  return null;
};

export const validateContact = (value: string): string | null => {
  if (!value) return null;
  if (!isValidPhone(value) && !isValidEmail(value)) {
    return isValidPhone(value.replace(/-/g, ''))
      ? VALIDATION_MESSAGES.INVALID_PHONE
      : VALIDATION_MESSAGES.INVALID_EMAIL;
  }
  return null;
};

export const hasSearchCriteria = (reservationId: string, contact: string): boolean => {
  return Boolean(reservationId || contact);
};

