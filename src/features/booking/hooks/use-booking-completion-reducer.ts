import { useReducer } from 'react';
import { validateName, validatePhone, validateEmail, formatPhoneNumber } from '../lib/validation-utils';

// State Interface
export interface BookingCompletionState {
  ui: {
    isModalOpen: boolean;
    isValidating: boolean;
    isSubmitting: boolean;
    showRetryButton: boolean;
  };

  form: {
    customerName: string;
    phoneNumber: string;
    email: string;
  };

  validation: {
    nameError: string | null;
    phoneError: string | null;
    emailError: string | null;
    isNameValid: boolean;
    isPhoneValid: boolean;
    isEmailValid: boolean;
  };

  error: {
    apiError: { code: string; message: string } | null;
    validationError: string | null;
  };

  result: {
    reservationId: string | null;
  };
}

// Action Types
export type BookingCompletionAction =
  | { type: 'OPEN_MODAL' }
  | { type: 'CLOSE_MODAL' }
  | { type: 'START_VALIDATING' }
  | { type: 'VALIDATION_SUCCESS' }
  | { type: 'VALIDATION_FAILURE'; payload: { message: string } }
  | { type: 'UPDATE_NAME'; payload: { name: string } }
  | { type: 'UPDATE_PHONE'; payload: { phone: string } }
  | { type: 'UPDATE_EMAIL'; payload: { email: string } }
  | { type: 'VALIDATE_NAME'; payload: { isValid: boolean; error: string | null } }
  | { type: 'VALIDATE_PHONE'; payload: { isValid: boolean; error: string | null } }
  | { type: 'VALIDATE_EMAIL'; payload: { isValid: boolean; error: string | null } }
  | { type: 'START_SUBMITTING' }
  | { type: 'SUBMIT_SUCCESS'; payload: { reservationId: string } }
  | { type: 'SUBMIT_FAILURE'; payload: { code: string; message: string } }
  | { type: 'SHOW_RETRY' }
  | { type: 'CLEAR_ERROR' }
  | { type: 'RESET_FORM' };

// Initial State
export const initialState: BookingCompletionState = {
  ui: {
    isModalOpen: false,
    isValidating: false,
    isSubmitting: false,
    showRetryButton: false,
  },
  form: {
    customerName: '',
    phoneNumber: '',
    email: '',
  },
  validation: {
    nameError: null,
    phoneError: null,
    emailError: null,
    isNameValid: false,
    isPhoneValid: false,
    isEmailValid: true,
  },
  error: {
    apiError: null,
    validationError: null,
  },
  result: {
    reservationId: null,
  },
};

// Reducer
export const bookingCompletionReducer = (
  state: BookingCompletionState,
  action: BookingCompletionAction
): BookingCompletionState => {
  switch (action.type) {
    case 'OPEN_MODAL':
      return {
        ...state,
        ui: {
          ...state.ui,
          isModalOpen: true,
        },
        error: {
          apiError: null,
          validationError: null,
        },
      };

    case 'CLOSE_MODAL':
      return {
        ...initialState,
        ui: { ...initialState.ui, isModalOpen: false },
      };

    case 'START_VALIDATING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isValidating: true,
        },
        error: {
          ...state.error,
          validationError: null,
        },
      };

    case 'VALIDATION_SUCCESS':
      return {
        ...state,
        ui: {
          ...state.ui,
          isValidating: false,
          isModalOpen: true,
        },
      };

    case 'VALIDATION_FAILURE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isValidating: false,
          isModalOpen: false,
        },
        error: {
          ...state.error,
          validationError: action.payload.message,
        },
      };

    case 'UPDATE_NAME': {
      const { name } = action.payload;
      const validation = validateName(name);
      return {
        ...state,
        form: {
          ...state.form,
          customerName: name,
        },
        validation: {
          ...state.validation,
          nameError: validation.error,
          isNameValid: validation.isValid,
        },
      };
    }

    case 'UPDATE_PHONE': {
      const { phone } = action.payload;
      const formattedPhone = formatPhoneNumber(phone);
      const validation = validatePhone(formattedPhone);
      return {
        ...state,
        form: {
          ...state.form,
          phoneNumber: formattedPhone,
        },
        validation: {
          ...state.validation,
          phoneError: validation.error,
          isPhoneValid: validation.isValid,
        },
      };
    }

    case 'UPDATE_EMAIL': {
      const { email } = action.payload;
      const validation = validateEmail(email);
      return {
        ...state,
        form: {
          ...state.form,
          email,
        },
        validation: {
          ...state.validation,
          emailError: validation.error,
          isEmailValid: validation.isValid,
        },
      };
    }

    case 'VALIDATE_NAME':
      return {
        ...state,
        validation: {
          ...state.validation,
          nameError: action.payload.error,
          isNameValid: action.payload.isValid,
        },
      };

    case 'VALIDATE_PHONE':
      return {
        ...state,
        validation: {
          ...state.validation,
          phoneError: action.payload.error,
          isPhoneValid: action.payload.isValid,
        },
      };

    case 'VALIDATE_EMAIL':
      return {
        ...state,
        validation: {
          ...state.validation,
          emailError: action.payload.error,
          isEmailValid: action.payload.isValid,
        },
      };

    case 'START_SUBMITTING':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSubmitting: true,
          showRetryButton: false,
        },
        error: {
          ...state.error,
          apiError: null,
        },
      };

    case 'SUBMIT_SUCCESS':
      return {
        ...initialState,
        result: {
          reservationId: action.payload.reservationId,
        },
        ui: {
          ...initialState.ui,
          isModalOpen: false,
        },
      };

    case 'SUBMIT_FAILURE':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSubmitting: false,
          showRetryButton: action.payload.code === 'NETWORK_ERROR',
          isModalOpen: action.payload.code === 'SEATS_NOT_AVAILABLE' ? false : state.ui.isModalOpen,
        },
        error: {
          ...state.error,
          apiError: action.payload,
        },
      };

    case 'SHOW_RETRY':
      return {
        ...state,
        ui: {
          ...state.ui,
          isSubmitting: false,
          showRetryButton: true,
        },
        error: {
          ...state.error,
          apiError: {
            code: 'NETWORK_ERROR',
            message: '예약 처리 중 오류가 발생했습니다. 다시 시도해주세요',
          },
        },
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: {
          apiError: null,
          validationError: null,
        },
        ui: {
          ...state.ui,
          showRetryButton: false,
        },
      };

    case 'RESET_FORM':
      return {
        ...initialState,
        ui: {
          ...initialState.ui,
          isModalOpen: state.ui.isModalOpen,
        },
      };

    default:
      return state;
  }
};

// Custom Hook
export const useBookingCompletionReducer = () => {
  return useReducer(bookingCompletionReducer, initialState);
};

