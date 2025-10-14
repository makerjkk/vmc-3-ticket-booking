'use client';

import React from 'react';
import { AlertCircle, RefreshCw, Home, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ErrorMessageProps {
  message: string;
  onRetry?: () => void;
  canRetry?: boolean;
  retryCount?: number;
  maxRetryCount?: number;
  className?: string;
}

export function ErrorMessage({
  message,
  onRetry,
  canRetry = true,
  retryCount = 0,
  maxRetryCount = 3,
  className,
}: ErrorMessageProps) {
  const isNetworkError = message.includes('네트워크') || message.includes('연결');
  const isServerError = message.includes('서버') || message.includes('500');
  const showRetryButton = canRetry && onRetry && retryCount < maxRetryCount;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-6 text-center',
        className
      )}
      role="alert"
      aria-live="polite"
    >
      {/* 에러 아이콘 */}
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
        <AlertCircle className="h-10 w-10 text-destructive" />
      </div>

      {/* 에러 메시지 */}
      <h3 className="mb-3 text-xl font-semibold text-foreground">
        문제가 발생했습니다
      </h3>
      
      <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
        {message}
      </p>

      {/* 재시도 정보 */}
      {retryCount > 0 && (
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border">
          <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
          <span className="text-xs text-muted-foreground">
            재시도 {retryCount}/{maxRetryCount}
          </span>
        </div>
      )}

      {/* 액션 버튼들 */}
      <div className="flex flex-col gap-3 sm:flex-row">
        {showRetryButton && (
          <Button
            onClick={onRetry}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90"
          >
            <RefreshCw className="h-4 w-4" />
            다시 시도
          </Button>
        )}

        <Button
          onClick={() => window.location.href = '/'}
          variant="outline"
          className="flex items-center gap-2 border-border hover:bg-card"
        >
          <Home className="h-4 w-4" />
          메인으로 돌아가기
        </Button>
      </div>

      {/* 추가 도움말 */}
      {(isNetworkError || isServerError || !showRetryButton) && (
        <div className="mt-12 rounded-xl bg-card border border-border p-6 text-left max-w-md">
          <h4 className="mb-3 text-sm font-medium text-foreground">
            문제가 계속 발생한다면:
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {isNetworkError && (
              <li className="flex items-center gap-2">
                <div className="w-1 h-1 bg-secondary rounded-full"></div>
                인터넷 연결 상태를 확인해주세요
              </li>
            )}
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-secondary rounded-full"></div>
              페이지를 새로고침해보세요
            </li>
            <li className="flex items-center gap-2">
              <div className="w-1 h-1 bg-secondary rounded-full"></div>
              잠시 후 다시 시도해주세요
            </li>
            <li className="flex items-center gap-2 pt-2 border-t border-border">
              <Phone className="h-4 w-4 text-secondary" />
              <span>고객센터: <span className="text-secondary font-medium">1588-0000</span></span>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
