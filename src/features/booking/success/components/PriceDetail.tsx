'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useBookingSuccess } from '../hooks/useBookingSuccess';
import { formatPrice } from '../lib/formatters';

/**
 * 가격 상세 표시
 */
export function PriceDetail() {
  const { reservationData, isPriceDetailExpanded, handleTogglePriceDetail } =
    useBookingSuccess();

  if (!reservationData) return null;

  return (
    <div 
      className="p-5 rounded-lg"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <div className="flex items-center justify-between mb-5">
        <h3 
          className="text-xl font-bold"
          style={{ color: '#1e293b' }}
        >
          결제 정보
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTogglePriceDetail}
          className="font-semibold"
          style={{ color: '#475569' }}
        >
          {isPriceDetailExpanded ? (
            <>
              숨기기 <ChevronUp className="w-4 h-4 ml-1" />
            </>
          ) : (
            <>
              상세 보기 <ChevronDown className="w-4 h-4 ml-1" />
            </>
          )}
        </Button>
      </div>

      {isPriceDetailExpanded && (
        <div className="space-y-3 mb-5">
          {reservationData.seats.map((seat) => (
            <div 
              key={seat.seatNumber} 
              className="flex justify-between text-sm p-3 rounded-lg"
              style={{ backgroundColor: '#ffffff' }}
            >
              <span 
                className="font-medium"
                style={{ color: '#64748b' }}
              >
                {seat.grade}석 {seat.seatNumber}
              </span>
              <span 
                className="font-bold"
                style={{ color: '#1e293b' }}
              >
                {formatPrice(seat.price)}
              </span>
            </div>
          ))}
          <Separator className="my-3" style={{ backgroundColor: '#e2e8f0' }} />
        </div>
      )}

      <div 
        className="flex justify-between items-center text-2xl font-bold p-4 rounded-lg"
        style={{ backgroundColor: '#ffffff' }}
      >
        <span style={{ color: '#1e293b' }}>총 결제 금액</span>
        <span style={{ color: '#1e293b' }}>{formatPrice(reservationData.totalPrice)}</span>
      </div>
    </div>
  );
}

