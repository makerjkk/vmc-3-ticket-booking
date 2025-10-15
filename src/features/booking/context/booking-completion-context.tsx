'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import {
  useBookingCompletionReducer,
  type BookingCompletionState,
  type BookingCompletionAction,
} from '../hooks/use-booking-completion-reducer';
import { validateName, validatePhone, validateEmail } from '../lib/validation-utils';

// Context Value Interface
export interface BookingCompletionContextValue {
  // State
  state: BookingCompletionState;

  // Modal Actions
  modalActions: {
    openModal: () => void;
    closeModal: () => void;
  };

  // Validation Actions
  validationActions: {
    startValidating: () => void;
    validationSuccess: () => void;
    validationFailure: (message: string) => void;
  };

  // Input Actions
  inputActions: {
    handleNameChange: (name: string) => void;
    handlePhoneChange: (phone: string) => void;
    handleEmailChange: (email: string) => void;
  };

  // Reservation Actions
  reservationActions: {
    startSubmitting: () => void;
    submitSuccess: (reservationId: string) => void;
    submitFailure: (code: string, message: string) => void;
    showRetry: () => void;
  };

  // Utility Actions
  utilityActions: {
    clearError: () => void;
    resetForm: () => void;
  };

  // Selectors
  selectors: {
    isReserveButtonEnabled: boolean;
    isCompleteButtonEnabled: (seatCount: number) => boolean;
    formattedPhoneNumber: string;
  };
}

// Context
const BookingCompletionContext = createContext<BookingCompletionContextValue | null>(null);

// Provider Props
interface BookingCompletionProviderProps {
  children: React.ReactNode;
}

// Provider Component
export const BookingCompletionProvider: React.FC<BookingCompletionProviderProps> = ({
  children,
}) => {
  const [state, dispatch] = useBookingCompletionReducer();

  // Modal Actions
  const openModal = useCallback(() => {
    dispatch({ type: 'OPEN_MODAL' });
  }, [dispatch]);

  const closeModal = useCallback(() => {
    dispatch({ type: 'CLOSE_MODAL' });
  }, [dispatch]);

  // Validation Actions
  const startValidating = useCallback(() => {
    dispatch({ type: 'START_VALIDATING' });
  }, [dispatch]);

  const validationSuccess = useCallback(() => {
    dispatch({ type: 'VALIDATION_SUCCESS' });
  }, [dispatch]);

  const validationFailure = useCallback(
    (message: string) => {
      dispatch({ type: 'VALIDATION_FAILURE', payload: { message } });
    },
    [dispatch]
  );

  // Input Actions
  const handleNameChange = useCallback(
    (name: string) => {
      dispatch({ type: 'UPDATE_NAME', payload: { name } });
    },
    [dispatch]
  );

  const handlePhoneChange = useCallback(
    (phone: string) => {
      dispatch({ type: 'UPDATE_PHONE', payload: { phone } });
    },
    [dispatch]
  );

  const handleEmailChange = useCallback(
    (email: string) => {
      dispatch({ type: 'UPDATE_EMAIL', payload: { email } });
    },
    [dispatch]
  );

  // Reservation Actions
  const startSubmitting = useCallback(() => {
    dispatch({ type: 'START_SUBMITTING' });
  }, [dispatch]);

  const submitSuccess = useCallback(
    (reservationId: string) => {
      dispatch({ type: 'SUBMIT_SUCCESS', payload: { reservationId } });
    },
    [dispatch]
  );

  const submitFailure = useCallback(
    (code: string, message: string) => {
      dispatch({ type: 'SUBMIT_FAILURE', payload: { code, message } });
    },
    [dispatch]
  );

  const showRetry = useCallback(() => {
    dispatch({ type: 'SHOW_RETRY' });
  }, [dispatch]);

  // Utility Actions
  const clearError = useCallback(() => {
    dispatch({ type: 'CLEAR_ERROR' });
  }, [dispatch]);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, [dispatch]);

  // Selectors
  const isReserveButtonEnabled = useMemo(() => {
    return (
      state.validation.isNameValid &&
      state.validation.isPhoneValid &&
      state.validation.isEmailValid &&
      !state.ui.isSubmitting
    );
  }, [
    state.validation.isNameValid,
    state.validation.isPhoneValid,
    state.validation.isEmailValid,
    state.ui.isSubmitting,
  ]);

  const isCompleteButtonEnabled = useCallback((seatCount: number) => {
    return seatCount > 0;
  }, []);

  const formattedPhoneNumber = useMemo(() => {
    return state.form.phoneNumber;
  }, [state.form.phoneNumber]);

  // Context Value
  const contextValue = useMemo<BookingCompletionContextValue>(
    () => ({
      state,
      modalActions: {
        openModal,
        closeModal,
      },
      validationActions: {
        startValidating,
        validationSuccess,
        validationFailure,
      },
      inputActions: {
        handleNameChange,
        handlePhoneChange,
        handleEmailChange,
      },
      reservationActions: {
        startSubmitting,
        submitSuccess,
        submitFailure,
        showRetry,
      },
      utilityActions: {
        clearError,
        resetForm,
      },
      selectors: {
        isReserveButtonEnabled,
        isCompleteButtonEnabled,
        formattedPhoneNumber,
      },
    }),
    [
      state,
      openModal,
      closeModal,
      startValidating,
      validationSuccess,
      validationFailure,
      handleNameChange,
      handlePhoneChange,
      handleEmailChange,
      startSubmitting,
      submitSuccess,
      submitFailure,
      showRetry,
      clearError,
      resetForm,
      isReserveButtonEnabled,
      isCompleteButtonEnabled,
      formattedPhoneNumber,
    ]
  );

  return (
    <BookingCompletionContext.Provider value={contextValue}>
      {children}
    </BookingCompletionContext.Provider>
  );
};

// Custom Hook
export const useBookingCompletionContext = (): BookingCompletionContextValue => {
  const context = useContext(BookingCompletionContext);

  if (!context) {
    throw new Error(
      'useBookingCompletionContext must be used within BookingCompletionProvider'
    );
  }

  return context;
};

