'use client';

import React, { memo } from 'react';
import { ArrowRight, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCompleteButton } from '../hooks/use-complete-button';
import { cn } from '@/lib/utils';
import type { Seat } from '../lib/dto';

interface CompleteButtonProps {
  onComplete?: (seats: Seat[]) => void;
  className?: string;
}

export const CompleteButton = memo<CompleteButtonProps>(({ 
  onComplete, 
  className 
}) => {
  const {
    isEnabled,
    isLoading,
    selectedSeatCount,
    onComplete: handleComplete,
    buttonText,
    buttonDisabledReason,
    canProceed,
    getValidationErrors,
  } = useCompleteButton(onComplete);

  const handleClick = () => {
    if (!canProceed()) {
      return;
    }

    try {
      handleComplete();
    } catch (error) {
      // 에러는 hook에서 처리됨
      console.error('Complete button error:', error);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* 메인 버튼 */}
      <Button
        onClick={handleClick}
        disabled={!isEnabled || isLoading}
        size="lg"
        className="w-full h-12 text-base font-medium"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            처리 중...
          </>
        ) : (
          <>
            {buttonText}
            {isEnabled && <ArrowRight className="w-4 h-4 ml-2" />}
          </>
        )}
      </Button>

      {/* 비활성화 이유 표시 */}
      {buttonDisabledReason && !isLoading && (
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
      {isEnabled && !isLoading && (
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>다음 단계: 예약자 정보 입력</p>
          <p>선택된 좌석은 5분간 임시 예약됩니다</p>
        </div>
      )}
    </div>
  );
});

CompleteButton.displayName = 'CompleteButton';
