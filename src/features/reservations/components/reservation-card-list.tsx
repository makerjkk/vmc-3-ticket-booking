'use client';

import React from 'react';
import type { ReservationSearchItem } from '../lib/dto';
import ReservationCard from './reservation-card';

type ReservationCardListProps = {
  reservations: ReservationSearchItem[];
};

export default function ReservationCardList({ reservations }: ReservationCardListProps) {
  return (
    <div className="space-y-4 mb-6">
      {reservations.map((reservation) => (
        <ReservationCard key={reservation.id} reservation={reservation} />
      ))}
    </div>
  );
}

