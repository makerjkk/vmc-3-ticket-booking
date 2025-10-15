'use client';

import React, { memo, useEffect } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, X } from 'lucide-react';
import { useSeatSelection } from '../context/seat-selection-context';
import { cn } from '@/lib/utils';

interface SeatSelectionAlertProps {
  className?: string;
}

export const SeatSelectionAlert = memo<SeatSelectionAlertProps>(({ className }) => {
  const { state, uiActions } = useSeatSelection();
  
  const alert = state.ui.showAlert;

  // 자동 숨김 처리
  useEffect(() => {
    if (alert?.duration && alert.duration > 0) {
      const timer = setTimeout(() => {
        uiActions.hideAlert();
      }, alert.duration);

      return () => clearTimeout(timer);
    }
  }, [alert?.duration, uiActions]);

  if (!alert) {
    return null;
  }

  // 아이콘 선택
  const getIcon = () => {
    switch (alert.type) {
      case 'info':
        return <Info className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'error':
        return <XCircle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  // 스타일 클래스 선택
  const getAlertClasses = () => {
    const baseClasses = [
      'fixed top-4 right-4 z-50',
      'flex items-start gap-3 p-4 rounded-lg shadow-lg',
      'max-w-md',
      'animate-in slide-in-from-right-full duration-300',
    ];

    switch (alert.type) {
      case 'info':
        baseClasses.push('bg-blue-50 border border-blue-200 text-blue-800');
        break;
      case 'warning':
        baseClasses.push('bg-amber-50 border border-amber-200 text-amber-800');
        break;
      case 'error':
        baseClasses.push('bg-red-50 border border-red-200 text-red-800');
        break;
      case 'success':
        baseClasses.push('bg-green-50 border border-green-200 text-green-800');
        break;
      default:
        baseClasses.push('bg-gray-50 border border-gray-200 text-gray-800');
        break;
    }

    return baseClasses;
  };

  const handleClose = () => {
    uiActions.hideAlert();
  };

  return (
    <div
      className={cn(getAlertClasses(), className)}
      role="alert"
      aria-live="assertive"
    >
      {/* 아이콘 */}
      <div className="flex-shrink-0 mt-0.5">
        {getIcon()}
      </div>

      {/* 메시지 */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium leading-5">
          {alert.message}
        </p>
      </div>

      {/* 닫기 버튼 */}
      <button
        type="button"
        onClick={handleClose}
        className="flex-shrink-0 ml-2 p-1 rounded-md hover:bg-black/5 transition-colors"
        aria-label="알림 닫기"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
});

SeatSelectionAlert.displayName = 'SeatSelectionAlert';
