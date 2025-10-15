'use client';

import React, { memo, useEffect, useState } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import { useSeatSelection } from '../context/seat-selection-context';
import { cn } from '@/lib/utils';

interface SeatSelectionTooltipProps {
  className?: string;
}

export const SeatSelectionTooltip = memo<SeatSelectionTooltipProps>(({ className }) => {
  const { state, uiActions } = useSeatSelection();
  const [isVisible, setIsVisible] = useState(false);

  const tooltip = state.ui.showTooltip;

  // 툴팁 표시/숨김 처리
  useEffect(() => {
    if (tooltip?.visible) {
      setIsVisible(true);
    } else {
      // 페이드아웃을 위한 딜레이
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [tooltip?.visible]);

  // 자동 숨김 처리
  useEffect(() => {
    if (tooltip?.visible && tooltip.type !== 'error') {
      const timer = setTimeout(() => {
        uiActions.hideTooltip();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [tooltip?.visible, tooltip?.type, uiActions]);

  if (!isVisible || !tooltip) {
    return null;
  }

  // 아이콘 선택
  const getIcon = () => {
    switch (tooltip.type) {
      case 'info':
        return <Info className="w-4 h-4" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4" />;
      case 'error':
        return <XCircle className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  // 스타일 클래스 선택
  const getTooltipClasses = () => {
    const baseClasses = [
      'fixed z-50 px-3 py-2 rounded-lg shadow-lg text-sm font-medium',
      'transition-all duration-150 ease-out',
      'max-w-xs',
    ];

    if (tooltip.visible) {
      baseClasses.push('opacity-100 scale-100');
    } else {
      baseClasses.push('opacity-0 scale-95');
    }

    switch (tooltip.type) {
      case 'info':
        baseClasses.push('bg-blue-600 text-white');
        break;
      case 'warning':
        baseClasses.push('bg-amber-600 text-white');
        break;
      case 'error':
        baseClasses.push('bg-red-600 text-white');
        break;
      default:
        baseClasses.push('bg-green-600 text-white');
        break;
    }

    return baseClasses;
  };

  // 위치 계산 (기본값 사용, 실제로는 마우스 위치나 타겟 엘리먼트 기준으로 계산)
  const position = tooltip.position || { x: 20, y: 20 };

  return (
    <>
      {/* 오버레이 (에러 타입인 경우에만) */}
      {tooltip.type === 'error' && (
        <div
          className="fixed inset-0 z-40 bg-black/10"
          onClick={() => uiActions.hideTooltip()}
        />
      )}

      {/* 툴팁 */}
      <div
        className={cn(getTooltipClasses(), className)}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
        }}
        role="tooltip"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          {getIcon()}
          <span>{tooltip.message}</span>
        </div>

        {/* 화살표 (선택사항) */}
        <div className="absolute -bottom-1 left-4 w-2 h-2 bg-inherit rotate-45 border-r border-b border-inherit"></div>
      </div>
    </>
  );
});

SeatSelectionTooltip.displayName = 'SeatSelectionTooltip';
