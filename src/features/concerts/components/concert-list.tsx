'use client';

import React from 'react';
import { Music, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConcertCard } from './concert-card';
import { LoadingSkeleton } from './loading-skeleton';
import { ErrorMessage } from './error-message';
import { useConcertListContext } from '@/features/concerts/context/concert-list-context';

interface ConcertListProps {
  className?: string;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <Music className="h-8 w-8 text-slate-400" />
      </div>
      
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        예매 가능한 콘서트가 없습니다
      </h3>
      
      <p className="mb-6 max-w-md text-sm text-slate-600">
        현재 예매 가능한 콘서트가 없습니다. 새로운 공연이 추가되면 알려드릴게요.
      </p>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Search className="h-4 w-4" />
        <span>새로운 공연을 준비 중입니다</span>
      </div>
    </div>
  );
}

export function ConcertList({ className }: ConcertListProps) {
  const { state, selectors, handlers } = useConcertListContext();

  // 로딩 상태
  if (state.isLoading) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  // 에러 상태
  if (state.error) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <ErrorMessage
          message={state.error}
          onRetry={handlers.onRetryButtonClick}
          canRetry={selectors.canRetry()}
          retryCount={state.retryCount}
          maxRetryCount={3}
        />
      </div>
    );
  }

  // 빈 목록 상태
  if (selectors.isEmpty()) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <EmptyState />
      </div>
    );
  }

  // 콘서트 목록 표시
  return (
    <div className={cn('container mx-auto px-4 py-8', className)}>
      {/* 헤더 */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">
          예매 가능한 콘서트
        </h2>
        <p className="text-slate-600">
          총 {state.concerts.length}개의 콘서트가 있습니다
        </p>
      </div>

      {/* 콘서트 그리드 */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {state.concerts.map((concert) => (
          <ConcertCard
            key={concert.id}
            concert={concert}
            isLoading={selectors.isCheckingAvailability(concert.id)}
            onBookingClick={() => handlers.onBookingButtonClick(concert.id)}
          />
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="mt-12 text-center">
        <p className="text-sm text-slate-500">
          더 많은 공연이 곧 추가될 예정입니다
        </p>
      </div>
    </div>
  );
}
