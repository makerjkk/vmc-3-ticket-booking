import { useReducer } from 'react';
import type { ReservationSearchItem } from '../lib/dto';

export type ReservationSearchState = {
  searchForm: {
    reservationId: string;
    contact: string;
  };
  validationErrors: {
    reservationId: string | null;
    contact: string | null;
  };
  searchResults: ReservationSearchItem[];
  isLoading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalCount: number;
};

export type ReservationSearchAction =
  | { type: 'SET_RESERVATION_ID'; payload: string }
  | { type: 'SET_CONTACT'; payload: string }
  | { type: 'SET_VALIDATION_ERROR'; payload: { field: 'reservationId' | 'contact'; error: string | null } }
  | { type: 'CLEAR_VALIDATION_ERRORS' }
  | { type: 'RESET_FORM' }
  | { type: 'SEARCH_START' }
  | { type: 'SEARCH_SUCCESS'; payload: { reservations: ReservationSearchItem[]; totalCount: number; totalPages: number } }
  | { type: 'SEARCH_FAILURE'; payload: string }
  | { type: 'SET_CURRENT_PAGE'; payload: number }
  | { type: 'RESET_STATE' };

export const initialState: ReservationSearchState = {
  searchForm: {
    reservationId: '',
    contact: '',
  },
  validationErrors: {
    reservationId: null,
    contact: null,
  },
  searchResults: [],
  isLoading: false,
  error: null,
  currentPage: 1,
  totalPages: 0,
  totalCount: 0,
};

function reservationSearchReducer(
  state: ReservationSearchState,
  action: ReservationSearchAction
): ReservationSearchState {
  switch (action.type) {
    case 'SET_RESERVATION_ID':
      return {
        ...state,
        searchForm: {
          ...state.searchForm,
          reservationId: action.payload,
        },
      };
    
    case 'SET_CONTACT':
      return {
        ...state,
        searchForm: {
          ...state.searchForm,
          contact: action.payload,
        },
      };
    
    case 'SET_VALIDATION_ERROR':
      return {
        ...state,
        validationErrors: {
          ...state.validationErrors,
          [action.payload.field]: action.payload.error,
        },
      };
    
    case 'CLEAR_VALIDATION_ERRORS':
      return {
        ...state,
        validationErrors: {
          reservationId: null,
          contact: null,
        },
      };
    
    case 'RESET_FORM':
      return {
        ...state,
        searchForm: {
          reservationId: '',
          contact: '',
        },
        validationErrors: {
          reservationId: null,
          contact: null,
        },
      };
    
    case 'SEARCH_START':
      return {
        ...state,
        isLoading: true,
        error: null,
        currentPage: 1,
      };
    
    case 'SEARCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        searchResults: action.payload.reservations,
        totalCount: action.payload.totalCount,
        totalPages: action.payload.totalPages,
        error: null,
      };
    
    case 'SEARCH_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      };
    
    case 'SET_CURRENT_PAGE':
      return {
        ...state,
        currentPage: action.payload,
      };
    
    case 'RESET_STATE':
      return initialState;
    
    default:
      return state;
  }
}

export const useReservationSearchReducer = () => {
  return useReducer(reservationSearchReducer, initialState);
};

