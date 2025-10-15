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
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">결제 정보</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleTogglePriceDetail}
          className="text-primary hover:text-primary/90"
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
        <div className="space-y-2 mb-4">
          {reservationData.seats.map((seat) => (
            <div key={seat.seatNumber} className="flex justify-between text-sm">
              <span className="text-gray-600">
                {seat.grade}석 {seat.seatNumber}
              </span>
              <span className="font-medium">{formatPrice(seat.price)}</span>
            </div>
          ))}
          <Separator className="my-2" />
        </div>
      )}

      <div className="flex justify-between items-center text-xl font-bold">
        <span>총 결제 금액</span>
        <span className="text-primary">{formatPrice(reservationData.totalPrice)}</span>
      </div>
    </div>
  );
}

