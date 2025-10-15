'use client';

import React, { memo, useCallback, type FormEvent } from 'react';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { CustomerInfoForm } from './customer-info-form';
import { useBookingCompletionContext } from '../context/booking-completion-context';
import type { SeatData } from '@/features/booking/backend/schema';
import { formatPrice } from '../lib/validation-utils';

interface CustomerInfoModalProps {
  selectedSeats: SeatData[];
  scheduleId: string;
  totalPrice: number;
  onReserve: (scheduleId: string, seatIds: string[], totalPrice: number) => void;
}

export const CustomerInfoModal = memo<CustomerInfoModalProps>(
  ({ selectedSeats, scheduleId, totalPrice, onReserve }) => {
    const {
      state,
      modalActions,
      inputActions,
      utilityActions,
      selectors,
    } = useBookingCompletionContext();

    const seatIds = selectedSeats.map((s) => s.id);

    const handleSubmit = useCallback(
      (e: FormEvent) => {
        e.preventDefault();

        if (!selectors.isReserveButtonEnabled) {
          return;
        }

        onReserve(scheduleId, seatIds, totalPrice);
      },
      [scheduleId, seatIds, totalPrice, onReserve, selectors.isReserveButtonEnabled]
    );

    return (
      <Sheet open={state.ui.isModalOpen} onOpenChange={modalActions.closeModal}>
        <SheetContent
          side="bottom"
          className="h-[90vh] sm:h-auto sm:max-w-[560px] sm:mx-auto overflow-y-auto"
        >
          <SheetHeader>
            <SheetTitle>예약자 정보 입력</SheetTitle>
            <SheetDescription>
              선택하신 좌석의 예약을 완료하기 위해 정보를 입력해주세요
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-6">
            {/* 선택된 좌석 요약 */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">선택 좌석</span>
                <span className="text-sm text-muted-foreground">
                  {selectedSeats.length}석
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                  >
                    {seat.seatNumber} ({seat.grade}석)
                  </span>
                ))}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border">
                <span className="text-base font-semibold">총 결제 금액</span>
                <span className="text-lg font-bold text-primary">
                  {formatPrice(totalPrice)}
                </span>
              </div>
            </div>

            {/* 고객 정보 입력 폼 */}
            <CustomerInfoForm
              form={state.form}
              validation={state.validation}
              inputActions={inputActions}
              onSubmit={handleSubmit}
              isSubmitting={state.ui.isSubmitting}
            />

            {/* 에러 메시지 */}
            {state.error.apiError && (
              <div
                className="bg-destructive/15 text-destructive px-4 py-3 rounded-lg flex items-start gap-2"
                role="alert"
              >
                <X className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium">
                    {state.error.apiError.message}
                  </p>
                </div>
                <button
                  onClick={utilityActions.clearError}
                  className="ml-auto hover:opacity-70"
                  aria-label="에러 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <SheetFooter className="flex-col sm:flex-row gap-2">
            {state.ui.showRetryButton && (
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={state.ui.isSubmitting}
                className="w-full sm:w-auto"
              >
                재시도
              </Button>
            )}

            <Button
              type="submit"
              disabled={!selectors.isReserveButtonEnabled}
              onClick={handleSubmit}
              className="w-full sm:flex-1"
            >
              {state.ui.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                '예약 확정'
              )}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    );
  }
);

CustomerInfoModal.displayName = 'CustomerInfoModal';

