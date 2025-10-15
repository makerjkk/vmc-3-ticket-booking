'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { ReservationSearchProvider, useReservationSearchContext } from '@/features/reservations/context/reservation-search-context';
import SearchForm from '@/features/reservations/components/search-form';
import ReservationCardList from '@/features/reservations/components/reservation-card-list';
import EmptyState from '@/features/reservations/components/empty-state';
import SearchError from '@/features/reservations/components/search-error';
import SearchLoadingSkeleton from '@/features/reservations/components/search-loading-skeleton';
import Pagination from '@/features/reservations/components/pagination';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';

function ReservationSearchContent() {
  const { state, actions } = useReservationSearchContext();
  const router = useRouter();
  
  const hasSearched = state.searchResults.length > 0 || state.error !== null;

  const handleGoHome = () => {
    router.push('/');
  };
  
  return (
    <div 
      className="container mx-auto p-6 sm:p-8 max-w-5xl"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div className="flex items-center justify-between mb-8">
        <h1 
          className="text-4xl font-bold"
          style={{ color: '#1e293b' }}
        >
          예약 조회
        </h1>
        <Button
          variant="outline"
          onClick={handleGoHome}
          className="flex items-center gap-2"
        >
          <Home className="w-4 h-4" />
          홈으로
        </Button>
      </div>
      
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
    <div 
      className="min-h-screen"
      style={{ backgroundColor: '#ffffff' }}
    >
      <ReservationSearchProvider>
        <ReservationSearchContent />
      </ReservationSearchProvider>
    </div>
  );
}

