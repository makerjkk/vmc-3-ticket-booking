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
    <div 
      className="mb-6 p-5 rounded-lg"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <h3 
        className="text-xl font-bold mb-5 flex items-center gap-2"
        style={{ color: '#1e293b' }}
      >
        <User className="w-6 h-6" style={{ color: '#3b82f6' }} />
        예약자 정보
      </h3>
      <div className="space-y-4">
        <div 
          className="flex items-start gap-3 p-3 rounded-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <span 
            className="text-sm font-semibold w-24 flex-shrink-0"
            style={{ color: '#64748b' }}
          >
            예약 번호
          </span>
          <span 
            className="text-base font-mono font-bold break-all"
            style={{ color: '#2563eb' }}
          >
            {reservationData.reservationNumber}
          </span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <User className="w-5 h-5 flex-shrink-0" style={{ color: '#64748b' }} />
          <span className="text-base font-medium" style={{ color: '#1e293b' }}>
            {reservationData.customerName}
          </span>
        </div>
        <div 
          className="flex items-center gap-3 p-3 rounded-lg"
          style={{ backgroundColor: '#ffffff' }}
        >
          <Phone className="w-5 h-5 flex-shrink-0" style={{ color: '#64748b' }} />
          <span className="text-base font-medium" style={{ color: '#1e293b' }}>
            {reservationData.customerPhone}
          </span>
        </div>
        {hasEmail && (
          <div 
            className="flex items-center gap-3 p-3 rounded-lg"
            style={{ backgroundColor: '#ffffff' }}
          >
            <Mail className="w-5 h-5 flex-shrink-0" style={{ color: '#64748b' }} />
            <span className="text-base font-medium break-all" style={{ color: '#1e293b' }}>
              {reservationData.customerEmail}
            </span>
          </div>
        )}
      </div>
      <Separator className="mt-6" style={{ backgroundColor: '#e2e8f0' }} />
    </div>
  );
}

