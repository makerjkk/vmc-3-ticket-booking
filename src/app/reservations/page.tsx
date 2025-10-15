'use client';

import React from 'react';
import { ReservationSearchProvider, useReservationSearchContext } from '@/features/reservations/context/reservation-search-context';
import SearchForm from '@/features/reservations/components/search-form';
import ReservationCardList from '@/features/reservations/components/reservation-card-list';
import EmptyState from '@/features/reservations/components/empty-state';
import SearchError from '@/features/reservations/components/search-error';
import SearchLoadingSkeleton from '@/features/reservations/components/search-loading-skeleton';
import Pagination from '@/features/reservations/components/pagination';

function ReservationSearchContent() {
  const { state, actions } = useReservationSearchContext();
  
  const hasSearched = state.searchResults.length > 0 || state.error !== null;
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">예약 조회</h1>
      
      <SearchForm />
      
      {state.isLoading && <SearchLoadingSkeleton />}
      
      {!state.isLoading && state.error && (
        <SearchError error={state.error} onRetry={actions.search} />
      )}
      
      {!state.isLoading && !state.error && state.searchResults.length > 0 && (
        <>
          <ReservationCardList reservations={state.searchResults} />
          <Pagination />
        </>
      )}
      
      {!state.isLoading && !state.error && hasSearched && state.searchResults.length === 0 && (
        <EmptyState />
      )}
    </div>
  );
}

export default function ReservationSearchPage() {
  return (
    <ReservationSearchProvider>
      <ReservationSearchContent />
    </ReservationSearchProvider>
  );
}

