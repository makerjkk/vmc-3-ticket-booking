'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useReservationSearchContext } from '../context/reservation-search-context';
import { usePagination } from '../hooks/use-pagination';

export default function Pagination() {
  const { state, actions } = useReservationSearchContext();
  const { showPagination, pageNumbers, canGoPrevious, canGoNext } = usePagination(
    state.currentPage,
    state.totalPages,
    state.totalCount
  );

  if (!showPagination) {
    return null;
  }

  const handlePrevious = () => {
    if (canGoPrevious) {
      actions.setCurrentPage(state.currentPage - 1);
    }
  };

  const handleNext = () => {
    if (canGoNext) {
      actions.setCurrentPage(state.currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    actions.setCurrentPage(page);
  };

  return (
    <div className="flex justify-center items-center space-x-2 py-4">
      <Button
        variant="outline"
        size="sm"
        onClick={handlePrevious}
        disabled={!canGoPrevious}
      >
        <ChevronLeft className="w-4 h-4" />
      </Button>

      {pageNumbers.map((page) => (
        <Button
          key={page}
          variant={page === state.currentPage ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePageClick(page)}
          className="min-w-[40px]"
        >
          {page}
        </Button>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={handleNext}
        disabled={!canGoNext}
      >
        <ChevronRight className="w-4 h-4" />
      </Button>

      <span className="text-sm text-gray-600 ml-4">
        총 {state.totalCount}건
      </span>
    </div>
  );
}

