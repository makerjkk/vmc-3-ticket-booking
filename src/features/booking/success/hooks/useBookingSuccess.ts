'use client';

import { useContext } from 'react';
import { BookingSuccessContext } from '../context/BookingSuccessContext';

/**
 * Booking Success Consumer Hook
 */
export function useBookingSuccess() {
  const context = useContext(BookingSuccessContext);

  if (context === undefined) {
    throw new Error('useBookingSuccess must be used within BookingSuccessProvider');
  }

  return context;
}

