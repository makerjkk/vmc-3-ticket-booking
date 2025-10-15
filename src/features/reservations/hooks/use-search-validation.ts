import { useCallback } from 'react';
import { validateReservationId, validateContact } from '../lib/validators';

export const useSearchValidation = () => {
  const validateReservationIdField = useCallback((value: string) => {
    return validateReservationId(value);
  }, []);

  const validateContactField = useCallback((value: string) => {
    return validateContact(value);
  }, []);

  return {
    validateReservationIdField,
    validateContactField,
  };
};

