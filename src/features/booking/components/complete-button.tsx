'use client';

import React, { memo } from 'react';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompleteButton } from '../hooks/use-complete-button';
import { useSeatSelection } from '../context/seat-selection-context';
import { cn } from '@/lib/utils';

interface CompleteButtonProps {
  scheduleId: string;
  className?: string;
}

export const CompleteButton = memo<CompleteButtonProps>(({ scheduleId, className }) => {
  const { state } = useSeatSelection();
  const { handleCompleteSelection, isValidating } = useCompleteButton();

  const selectedSeats = state.core.selectedSeats;
  const selectedSeatCount = selectedSeats.length;
  const seatIds = selectedSeats.map((s) => s.id);
  const isEnabled = selectedSeatCount > 0 && !isValidating;

  const handleClick = () => {
    if (!isEnabled) {
      return;
    }

    handleCompleteSelection(scheduleId, seatIds);
  };

  const buttonText =
    selectedSeatCount === 0 ? '좌석을 선택해주세요' : '좌석 선택 완료';

  const buttonDisabledReason =
    selectedSeatCount === 0 ? '최소 1개 이상의 좌석을 선택해주세요' : null;

  return (
    <div className={cn('space-y-3', className)}>
      {/* 메인 버튼 */}
      <Button
        onClick={handleClick}
        disabled={!isEnabled}
        size="lg"
        className="w-full h-14 text-base font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all disabled:bg-gray-300 disabled:text-gray-500"
        style={{ 
          backgroundColor: isEnabled ? '#2563eb' : '#d1d5db',
          color: '#ffffff'
        }}
      >
        {isValidating ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            <span className="font-bold">좌석 확인 중...</span>
          </>
        ) : (
          <>
            <span className="font-bold">{buttonText}</span>
            {isEnabled && <ArrowRight className="w-5 h-5 ml-2" />}
          </>
        )}
      </Button>

      {/* 비활성화 이유 표시 */}
      {buttonDisabledReason && !isValidating && (
        <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-700">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{buttonDisabledReason}</span>
        </div>
      )}

      {/* 선택 상태 요약 */}
      {selectedSeatCount > 0 && (
        <div className="text-center text-sm text-gray-600">
          {selectedSeatCount}석 선택됨 • 최대 4석까지 가능
        </div>
      )}

      {/* 진행 단계 안내 */}
      {isEnabled && !isValidating && (
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>다음 단계: 예약자 정보 입력</p>
          <p>선택된 좌석은 임시 예약됩니다</p>
        </div>
      )}
    </div>
  );
});

CompleteButton.displayName = 'CompleteButton';
