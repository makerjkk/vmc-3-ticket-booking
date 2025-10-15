'use client';

import React, { createContext, useContext, useCallback } from 'react';
import { useReservationSearchReducer } from '../hooks/use-reservation-search-reducer';
import type { ReservationSearchState, ReservationSearchAction } from '../hooks/use-reservation-search-reducer';
import { useReservationSearch } from '../hooks/use-reservation-search';
import { useSearchValidation } from '../hooks/use-search-validation';
import { isValidPhone, isValidEmail } from '../lib/validators';
import { SEARCH_CONSTANTS, VALIDATION_MESSAGES, ERROR_MESSAGES } from '../constants/search';

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
    // 예약번호 또는 연락처 중 하나는 반드시 입력되어야 함
    const hasReservationId = Boolean(state.searchForm.reservationId.trim());
    const hasContact = Boolean(state.searchForm.contact.trim());
    
    if (!hasReservationId && !hasContact) {
      dispatch({
        type: 'SET_VALIDATION_ERROR',
        payload: { field: 'reservationId', error: VALIDATION_MESSAGES.NO_SEARCH_CRITERIA },
      });
      dispatch({
        type: 'SET_VALIDATION_ERROR',
        payload: { field: 'contact', error: VALIDATION_MESSAGES.NO_SEARCH_CRITERIA },
      });
      return;
    }

    // 입력된 필드에 대해서만 유효성 검사
    if (hasReservationId && state.validationErrors.reservationId) {
      return;
    }
    if (hasContact && state.validationErrors.contact) {
      return;
    }

    dispatch({ type: 'SEARCH_START' });

    const params = {
      reservationId: hasReservationId ? state.searchForm.reservationId : undefined,
      phone: hasContact && isValidPhone(state.searchForm.contact) ? state.searchForm.contact : undefined,
      email: hasContact && !isValidPhone(state.searchForm.contact) && state.searchForm.contact
        ? state.searchForm.contact
        : undefined,
      page: 1,
      pageSize: SEARCH_CONSTANTS.ITEMS_PER_PAGE,
    };

    const result = await searchReservations(params);

    if (result.ok && result.data) {
      // 결과가 있으면 성공
      if (result.data.reservations.length > 0) {
        dispatch({
          type: 'SEARCH_SUCCESS',
          payload: {
            reservations: result.data.reservations,
            totalCount: result.data.totalCount,
            totalPages: result.data.totalPages,
          },
        });
      } else {
        // 결과가 없으면 검색 조건에 따라 적절한 메시지 표시
        let errorMessage: string = VALIDATION_MESSAGES.SEARCH_FAILED;
        
        if (hasReservationId && !hasContact) {
          errorMessage = ERROR_MESSAGES.RESERVATION_NOT_FOUND;
        } else if (!hasReservationId && hasContact) {
          if (isValidPhone(state.searchForm.contact)) {
            errorMessage = ERROR_MESSAGES.PHONE_NOT_FOUND;
          } else if (isValidEmail(state.searchForm.contact)) {
            errorMessage = ERROR_MESSAGES.EMAIL_NOT_FOUND;
          } else {
            errorMessage = ERROR_MESSAGES.CONTACT_NOT_FOUND;
          }
        } else {
          // 둘 다 입력한 경우
          errorMessage = '입력하신 정보와 일치하는 예약을 찾을 수 없습니다';
        }
        
        dispatch({
          type: 'SEARCH_FAILURE',
          payload: errorMessage,
        });
      }
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

