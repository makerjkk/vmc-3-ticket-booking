'use client';

import { Calendar } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useBookingSuccess } from '../hooks/useBookingSuccess';
import { formatScheduleDateTime } from '../lib/formatters';

/**
 * 콘서트 정보 표시
 */
export function ConcertInfo() {
  const { reservationData } = useBookingSuccess();

  if (!reservationData) return null;

  const formattedDate = formatScheduleDateTime(reservationData.schedule.dateTime);

  return (
    <div 
      className="mb-6 p-5 rounded-lg"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <h3 
        className="text-xl font-bold mb-5"
        style={{ color: '#1e293b' }}
      >
        콘서트 정보
      </h3>
      <div 
        className="flex gap-4 mb-4 p-4 rounded-lg"
        style={{ backgroundColor: '#ffffff' }}
      >
        <img
          src={reservationData.concert.posterImageUrl}
          alt={reservationData.concert.title}
          className="w-24 h-36 object-cover rounded-lg flex-shrink-0 shadow-md"
        />
        <div className="flex-1 min-w-0">
          <h4 
            className="text-xl font-bold mb-3 break-words"
            style={{ color: '#1e293b' }}
          >
            {reservationData.concert.title}
          </h4>
          <div className="space-y-2">
            <div 
              className="flex items-start gap-2"
            >
              <Calendar className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: '#64748b' }} />
              <span 
                className="break-words font-medium"
                style={{ color: '#475569' }}
              >
                {formattedDate}
              </span>
            </div>
          </div>
        </div>
      </div>
      <Separator className="mt-6" style={{ backgroundColor: '#e2e8f0' }} />
    </div>
  );
}

