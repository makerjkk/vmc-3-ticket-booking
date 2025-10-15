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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4">콘서트 정보</h3>
      <div className="flex gap-4 mb-4">
        <img
          src={reservationData.concert.posterImageUrl}
          alt={reservationData.concert.title}
          className="w-24 h-36 object-cover rounded-lg flex-shrink-0"
        />
        <div className="flex-1 min-w-0">
          <h4 className="text-xl font-bold mb-2 break-words">
            {reservationData.concert.title}
          </h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2 text-gray-600">
              <Calendar className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span className="break-words">{formattedDate}</span>
            </div>
          </div>
        </div>
      </div>
      <Separator className="mt-6" />
    </div>
  );
}

