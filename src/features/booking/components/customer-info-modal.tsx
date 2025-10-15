'use client';

import React, { memo, useCallback, useEffect, type FormEvent } from 'react';
import { Loader2, X, AlertCircle, CheckCircle2 } from 'lucide-react';
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
import { useDuplicateCheck } from '../hooks/use-duplicate-check';

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

    const { isChecking, duplicateInfo, checkDuplicate } = useDuplicateCheck();

    console.log('[CustomerInfoModal] 렌더링:', { 
      isModalOpen: state.ui.isModalOpen, 
      selectedSeatsCount: selectedSeats.length 
    });

    const seatIds = selectedSeats.map((s) => s.id);

    // 전화번호 변경 시 중복 확인 (debounce)
    useEffect(() => {
      if (state.form.phoneNumber && state.validation.isPhoneValid) {
        const timer = setTimeout(() => {
          checkDuplicate(scheduleId, state.form.phoneNumber);
        }, 800); // 800ms debounce

        return () => clearTimeout(timer);
      }
    }, [state.form.phoneNumber, state.validation.isPhoneValid, scheduleId, checkDuplicate]);

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
          className="h-[90vh] sm:h-auto sm:max-w-[640px] sm:mx-auto overflow-y-auto"
          style={{ backgroundColor: '#ffffff !important' }}
        >
          <SheetHeader className="space-y-3 pb-4">
            <SheetTitle className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              예약자 정보 입력
            </SheetTitle>
            <SheetDescription className="text-base text-gray-600 dark:text-gray-400">
              선택하신 좌석의 예약을 완료하기 위해 정보를 입력해주세요
            </SheetDescription>
          </SheetHeader>

          <div className="py-6 space-y-8">
            {/* 선택된 좌석 요약 */}
            <div 
              className="p-6 rounded-xl border-2 space-y-4 shadow-sm"
              style={{ 
                backgroundColor: '#f8fafc',
                borderColor: '#cbd5e1',
                color: '#1e293b'
              }}
            >
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold" style={{ color: '#334155' }}>선택 좌석</span>
                <span 
                  className="text-sm font-medium px-3 py-1 rounded-full"
                  style={{ 
                    backgroundColor: '#e0e7ff',
                    color: '#3730a3'
                  }}
                >
                  {selectedSeats.length}석
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedSeats.map((seat) => (
                  <span
                    key={seat.id}
                    className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm transition-colors"
                    style={{
                      backgroundColor: '#2563eb',
                      color: '#ffffff'
                    }}
                  >
                    {seat.seatNumber} <span className="ml-1" style={{ color: '#bfdbfe' }}>({seat.grade}석)</span>
                  </span>
                ))}
              </div>
              <div 
                className="flex justify-between items-center pt-4 border-t"
                style={{ borderColor: '#cbd5e1' }}
              >
                <span className="text-lg font-bold" style={{ color: '#1e293b' }}>총 결제 금액</span>
                <span className="text-2xl font-bold" style={{ color: '#2563eb' }}>
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

            {/* 중복 예약 확인 메시지 */}
            {isChecking && state.validation.isPhoneValid && (
              <div
                className="bg-blue-50 border-2 border-blue-200 text-blue-800 px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm animate-pulse"
                style={{
                  backgroundColor: '#eff6ff',
                  borderColor: '#bfdbfe',
                  color: '#1e40af',
                }}
              >
                <Loader2 className="h-5 w-5 animate-spin flex-shrink-0" style={{ color: '#3b82f6' }} />
                <p className="text-sm font-medium">예약 확인 중...</p>
              </div>
            )}

            {duplicateInfo?.isDuplicate && !isChecking && (
              <div
                className="bg-yellow-50 border-2 border-yellow-300 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm"
                style={{
                  backgroundColor: '#fefce8',
                  borderColor: '#fde047',
                  color: '#854d0e',
                }}
                role="alert"
              >
                <AlertCircle className="h-6 w-6 mt-0.5 flex-shrink-0" style={{ color: '#eab308' }} />
                <div className="flex-1">
                  <p className="text-sm font-bold mb-1" style={{ color: '#854d0e' }}>
                    이미 예약하신 전화번호입니다
                  </p>
                  <p className="text-sm" style={{ color: '#a16207' }}>
                    같은 전화번호로 이 공연을 이미 예약하셨습니다.
                    {duplicateInfo.reservationNumber && (
                      <span className="block mt-1">
                        예약 번호: <strong>{duplicateInfo.reservationNumber}</strong>
                      </span>
                    )}
                  </p>
                  <p className="text-xs mt-2" style={{ color: '#a16207' }}>
                    💡 다른 전화번호로 예약하시거나, 예약 조회 페이지에서 기존 예약을 확인해주세요.
                  </p>
                </div>
              </div>
            )}

            {!duplicateInfo?.isDuplicate && !isChecking && state.validation.isPhoneValid && state.form.phoneNumber.length >= 12 && (
              <div
                className="bg-green-50 border-2 border-green-300 px-5 py-3 rounded-xl flex items-center gap-3 shadow-sm"
                style={{
                  backgroundColor: '#f0fdf4',
                  borderColor: '#86efac',
                  color: '#166534',
                }}
              >
                <CheckCircle2 className="h-5 w-5 flex-shrink-0" style={{ color: '#22c55e' }} />
                <p className="text-sm font-medium">예약 가능한 전화번호입니다</p>
              </div>
            )}

            {/* 에러 메시지 */}
            {state.error.apiError && (
              <div
                className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200 px-5 py-4 rounded-xl flex items-start gap-3 shadow-sm"
                role="alert"
              >
                <X className="h-5 w-5 mt-0.5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">
                    {state.error.apiError.message}
                  </p>
                </div>
                <button
                  onClick={utilityActions.clearError}
                  className="ml-auto hover:opacity-70 transition-opacity p-1 hover:bg-red-100 dark:hover:bg-red-900/40 rounded"
                  aria-label="에러 닫기"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          <SheetFooter className="flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200 dark:border-gray-800">
            {state.ui.showRetryButton && (
              <Button
                variant="outline"
                onClick={handleSubmit}
                disabled={state.ui.isSubmitting}
                className="w-full sm:w-auto border-2 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                재시도
              </Button>
            )}

            <Button
              type="submit"
              disabled={!selectors.isReserveButtonEnabled || duplicateInfo?.isDuplicate || isChecking}
              onClick={handleSubmit}
              className="w-full sm:flex-1 h-12 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {state.ui.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  처리 중...
                </>
              ) : duplicateInfo?.isDuplicate ? (
                '이미 예약된 전화번호'
              ) : isChecking ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  확인 중...
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

