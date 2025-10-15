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
    <div 
      className="mb-6 p-5 rounded-lg"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <h3 
        className="text-xl font-bold mb-5 flex items-center gap-2"
        style={{ color: '#1e293b' }}
      >
        <Ticket className="w-6 h-6" style={{ color: '#3b82f6' }} />
        좌석 정보
      </h3>
      <div className="space-y-4">
        {Object.entries(groupedSeats).map(([grade, seats]) => (
          <div 
            key={grade} 
            className="flex items-start gap-3 p-3 rounded-lg"
            style={{ backgroundColor: '#ffffff' }}
          >
            <Badge 
              variant="outline" 
              className="flex-shrink-0 font-bold border-2"
              style={{ 
                borderColor: '#3b82f6',
                color: '#3b82f6'
              }}
            >
              {grade}석
            </Badge>
            <div className="flex-1 flex flex-wrap gap-2">
              {seats.map((seat) => (
                <span 
                  key={seat.seatNumber} 
                  className="font-medium"
                  style={{ color: '#1e293b' }}
                >
                  {seat.seatNumber}
                </span>
              ))}
            </div>
          </div>
        ))}
        <div 
          className="text-base font-semibold mt-3 p-3 rounded-lg"
          style={{ 
            backgroundColor: '#ffffff',
            color: '#64748b'
          }}
        >
          총 {reservationData.seatCount}석
        </div>
      </div>
      <Separator className="mt-6" style={{ backgroundColor: '#e2e8f0' }} />
    </div>
  );
}

