'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useBookingSuccess } from '../hooks/useBookingSuccess';

/**
 * 에러 상태 뷰
 */
export function ErrorView() {
  const { error, hasError, showRetryButton, handleRetry, handleNavigateToHome } =
    useBookingSuccess();

  if (!hasError || !error) return null;

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">오류가 발생했습니다</h2>
          <p className="text-gray-600 mb-6">{error.message}</p>
          <div className="flex gap-3 justify-center">
            {showRetryButton && (
              <Button onClick={handleRetry} variant="default">
                다시 시도
              </Button>
            )}
            <Button onClick={handleNavigateToHome} variant="outline">
              메인으로 돌아가기
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

