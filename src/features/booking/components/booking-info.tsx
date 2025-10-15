'use client';

import React, { memo } from 'react';
import { X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useBookingInfo } from '../hooks/use-booking-info';
import { cn } from '@/lib/utils';

interface BookingInfoProps {
  className?: string;
}

export const BookingInfo = memo<BookingInfoProps>(({ className }) => {
  const {
    selectedSeats,
    totalPrice,
    selectedSeatCount,
    seatsByGrade,
    priceBreakdown,
    removeSeat,
    clearAllSeats,
    formatPrice,
    formatSeatList,
    canProceed,
    validationErrors,
  } = useBookingInfo();

  // 선택된 좌석이 없는 경우
  if (selectedSeatCount === 0) {
    return (
      <Card className={cn('w-full', className)}>
        <CardHeader>
          <CardTitle className="text-lg">예약 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">선택된 좌석이 없습니다</p>
            <p className="text-xs mt-1">좌석을 선택해주세요</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">예약 정보</CardTitle>
          <Badge variant="secondary" className="text-sm">
            {selectedSeatCount}/4석
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 선택된 좌석 목록 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-900">선택된 좌석</h3>
            {selectedSeatCount > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearAllSeats}
                className="text-xs text-gray-500 hover:text-red-600"
              >
                <Trash2 className="w-3 h-3 mr-1" />
                전체 삭제
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {selectedSeats.map((seat) => (
              <div
                key={seat.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {/* 등급 표시 */}
                  <Badge
                    variant={seat.grade === 'R' ? 'default' : seat.grade === 'S' ? 'secondary' : 'outline'}
                    className="text-xs"
                  >
                    {seat.grade}석
                  </Badge>

                  {/* 좌석 정보 */}
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {seat.rowName}열 {seat.seatIndex}번
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatPrice(seat.price)}
                    </div>
                  </div>
                </div>

                {/* 삭제 버튼 */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSeat(seat.id)}
                  className="text-gray-400 hover:text-red-600 p-1"
                  aria-label={`${seat.rowName}열 ${seat.seatIndex}번 좌석 선택 해제`}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {/* 등급별 요약 */}
        {priceBreakdown.length > 1 && (
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-900">등급별 요약</h3>
            <div className="space-y-1">
              {priceBreakdown.map((item) => (
                <div
                  key={item.grade}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-gray-600">
                    {item.grade}석 × {item.count}
                  </span>
                  <span className="font-medium">
                    {formatPrice(item.totalPrice)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 총 금액 */}
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <span className="text-base font-medium text-gray-900">총 금액</span>
            <span className="text-lg font-bold text-primary">
              {formatPrice(totalPrice)}
            </span>
          </div>
        </div>

        {/* 유효성 검증 에러 */}
        {validationErrors.length > 0 && (
          <div className="space-y-2">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700"
              >
                <span>⚠️</span>
                <span>{error}</span>
              </div>
            ))}
          </div>
        )}

        {/* 선택 완료 가능 상태 표시 */}
        {canProceed && (
          <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
            <span>✅</span>
            <span>좌석 선택이 완료되었습니다</span>
          </div>
        )}

        {/* 추가 정보 */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• 최대 4석까지 선택할 수 있습니다</p>
          <p>• 선택된 좌석은 5분간 임시 예약됩니다</p>
          <p>• 다른 사용자가 선택한 좌석은 자동으로 해제됩니다</p>
        </div>
      </CardContent>
    </Card>
  );
});

BookingInfo.displayName = 'BookingInfo';
