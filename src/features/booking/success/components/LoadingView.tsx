'use client';

import { Loader2 } from 'lucide-react';
import { useBookingSuccess } from '../hooks/useBookingSuccess';

/**
 * 로딩 상태 뷰
 */
export function LoadingView() {
  const { isRetrying, isLoading } = useBookingSuccess();

  if (!isLoading) return null;

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <Loader2 className="w-12 h-12 animate-spin text-primary mb-4" />
      <p className="text-gray-600">
        {isRetrying ? '다시 시도 중...' : '예약 정보를 불러오는 중...'}
      </p>
    </div>
  );
}

