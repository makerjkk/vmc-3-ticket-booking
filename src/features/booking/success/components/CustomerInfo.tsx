'use client';

import { User, Phone, Mail } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { useBookingSuccess } from '../hooks/useBookingSuccess';

/**
 * 예약자 정보 표시
 */
export function CustomerInfo() {
  const { reservationData, hasEmail } = useBookingSuccess();

  if (!reservationData) return null;

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <User className="w-5 h-5" />
        예약자 정보
      </h3>
      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <span className="text-sm text-gray-500 w-24 flex-shrink-0">예약 번호</span>
          <span className="text-sm font-mono text-gray-900 break-all">
            {reservationData.reservationNumber}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <User className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700">{reservationData.customerName}</span>
        </div>
        <div className="flex items-center gap-3">
          <Phone className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-gray-700">{reservationData.customerPhone}</span>
        </div>
        {hasEmail && (
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-gray-500 flex-shrink-0" />
            <span className="text-gray-700 break-all">{reservationData.customerEmail}</span>
          </div>
        )}
      </div>
      <Separator className="mt-6" />
    </div>
  );
}

