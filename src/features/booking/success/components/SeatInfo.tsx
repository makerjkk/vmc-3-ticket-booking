'use client';

import { Ticket } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useBookingSuccess } from '../hooks/useBookingSuccess';
import { groupSeatsByGrade } from '../lib/formatters';

/**
 * 좌석 정보 표시
 */
export function SeatInfo() {
  const { reservationData } = useBookingSuccess();

  if (!reservationData) return null;

  const groupedSeats = groupSeatsByGrade(reservationData.seats);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Ticket className="w-5 h-5" />
        좌석 정보
      </h3>
      <div className="space-y-3">
        {Object.entries(groupedSeats).map(([grade, seats]) => (
          <div key={grade} className="flex items-start gap-3">
            <Badge variant="outline" className="flex-shrink-0">
              {grade}석
            </Badge>
            <div className="flex-1 flex flex-wrap gap-2">
              {seats.map((seat) => (
                <span key={seat.seatNumber} className="text-gray-700">
                  {seat.seatNumber}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div className="text-sm text-gray-600 mt-2">
          총 {reservationData.seatCount}석
        </div>
      </div>
      <Separator className="mt-6" />
    </div>
  );
}

