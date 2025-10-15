'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useReservationSearchReducer } from '../hooks/use-reservation-search-reducer';
import type { ReservationSearchState, ReservationSearchAction } from '../hooks/use-reservation-search-reducer';
import { useReservationSearch } from '../hooks/use-reservation-search';
import { useSearchValidation } from '../hooks/use-search-validation';
import { isValidPhone } from '../lib/validators';
import { SEARCH_CONSTANTS, VALIDATION_MESSAGES } from '../constants/search';

type ReservationSearchContextType = {
  state: ReservationSearchState;
  actions: {
    setReservationId: (value: string) => void;
    setContact: (value: string) => void;
    search: () => Promise<void>;
    setCurrentPage: (page: number) => void;
    resetForm: () => void;
    resetState: () => void;
  };
};

const ReservationSearchContext = createContext<ReservationSearchContextType | null>(null);

export const ReservationSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReservationSearchReducer();
  const { searchReservations } = useReservationSearch();
  const { validateReservationIdField, validateContactField } = useSearchValidation();

  const setReservationId = useCallback((value: string) => {
    dispatch({ type: 'SET_RESERVATION_ID', payload: value });
    const error = validateReservationIdField(value);
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field: 'reservationId', error } });
  }, [validateReservationIdField]);

  const setContact = useCallback((value: string) => {
    dispatch({ type: 'SET_CONTACT', payload: value });
    const error = validateContactField(value);
    dispatch({ type: 'SET_VALIDATION_ERROR', payload: { field: 'contact', error } });
  }, [validateContactField]);

  const search = useCallback(async () => {
    if (!state.searchForm.reservationId && !state.searchForm.contact) {
      dispatch({
        type: 'SET_VALIDATION_ERROR',
        payload: { field: 'reservationId', error: VALIDATION_MESSAGES.NO_SEARCH_CRITERIA },
      });
      return;
    }

    if (state.validationErrors.reservationId || state.validationErrors.contact) {
      return;
    }

    dispatch({ type: 'SEARCH_START' });

    const params = {
      reservationId: state.searchForm.reservationId || undefined,
      phone: isValidPhone(state.searchForm.contact) ? state.searchForm.contact : undefined,
      email: !isValidPhone(state.searchForm.contact) && state.searchForm.contact
        ? state.searchForm.contact
        : undefined,
      page: 1,
      pageSize: SEARCH_CONSTANTS.ITEMS_PER_PAGE,
    };

    const result = await searchReservations(params);

    if (result.ok && result.data) {
      dispatch({
        type: 'SEARCH_SUCCESS',
        payload: {
          reservations: result.data.reservations,
          totalCount: result.data.totalCount,
          totalPages: result.data.totalPages,
        },
      });
    } else {
      dispatch({
        type: 'SEARCH_FAILURE',
        payload: result.error?.message || VALIDATION_MESSAGES.SEARCH_FAILED,
      });
    }
  }, [state.searchForm, state.validationErrors, searchReservations]);

  const setCurrentPage = useCallback((page: number) => {
    dispatch({ type: 'SET_CURRENT_PAGE', payload: page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const resetForm = useCallback(() => {
    dispatch({ type: 'RESET_FORM' });
  }, []);

  const resetState = useCallback(() => {
    dispatch({ type: 'RESET_STATE' });
  }, []);

  const value = {
    state,
    actions: {
      setReservationId,
      setContact,
      search,
      setCurrentPage,
      resetForm,
      resetState,
    },
  };

  return (
    <ReservationSearchContext.Provider value={value}>
      {children}
    </ReservationSearchContext.Provider>
  );
};

export const useReservationSearchContext = () => {
  const context = useContext(ReservationSearchContext);
  if (!context) {
    throw new Error('useReservationSearchContext must be used within ReservationSearchProvider');
  }
  return context;
};

