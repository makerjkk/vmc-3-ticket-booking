import { useMemo } from 'react';
import { SEARCH_CONSTANTS } from '../constants/search';

export const usePagination = (
  currentPage: number,
  totalPages: number,
  totalCount: number
) => {
  const showPagination = useMemo(() => {
    return totalCount > SEARCH_CONSTANTS.ITEMS_PER_PAGE;
  }, [totalCount]);

  const pageNumbers = useMemo(() => {
    const maxVisible = 5;
    const pages: number[] = [];
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  }, [currentPage, totalPages]);

  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return {
    showPagination,
    pageNumbers,
    canGoPrevious,
    canGoNext,
  };
};

