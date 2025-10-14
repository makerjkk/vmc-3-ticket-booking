'use client';

import React from 'react';
import { Music, Search } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConcertCard } from './concert-card';
import { LoadingSkeleton } from './loading-skeleton';
import { ErrorMessage } from './error-message';
import { useConcertListContext } from '@/features/concerts/context/concert-list-context-simple';

interface ConcertListProps {
  className?: string;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-card border border-border">
        <Music className="h-10 w-10 text-muted-foreground" />
      </div>
      
      <h3 className="mb-3 text-xl font-semibold text-foreground">
        예매 가능한 콘서트가 없습니다
      </h3>
      
      <p className="mb-8 max-w-md text-muted-foreground leading-relaxed">
        현재 예매 가능한 콘서트가 없습니다. 새로운 공연이 추가되면 알려드릴게요.
      </p>

      <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border">
        <div className="w-2 h-2 bg-accent rounded-full animate-pulse"></div>
        <span className="text-sm text-muted-foreground">새로운 공연을 준비 중입니다</span>
      </div>
    </div>
  );
}

export function ConcertListSimple({ className }: ConcertListProps) {
  const { concerts, isLoading, error, refetch, navigateToBooking } = useConcertListContext();

  // 로딩 상태
  if (isLoading) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <LoadingSkeleton count={6} />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <ErrorMessage
          message={error}
          onRetry={refetch}
          canRetry={true}
          retryCount={0}
          maxRetryCount={3}
        />
      </div>
    );
  }

  // 빈 목록 상태
  if (concerts.length === 0) {
    return (
      <div className={cn('container mx-auto px-4 py-8', className)}>
        <EmptyState />
      </div>
    );
  }

  // 콘서트 목록 표시
  return (
    <div className={cn('container mx-auto px-4 py-8', className)} style={{ backgroundColor: '#0D0E24' }}>
      {/* 헤더 */}
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold text-foreground mb-3">
          <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            예매 가능한 콘서트
          </span>
        </h2>
        <p className="text-muted-foreground text-lg">
          총 <span className="text-secondary font-semibold">{concerts.length}개</span>의 콘서트가 있습니다
        </p>
      </div>

      {/* 콘서트 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {concerts.map((concert) => (
          <ConcertCard
            key={concert.id}
            concert={concert}
            isLoading={false}
            onBookingClick={() => navigateToBooking(concert.id)}
          />
        ))}
      </div>

      {/* 추가 정보 */}
      <div className="mt-16 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gray-800 border border-gray-600">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
          <p className="text-sm text-gray-300">
            더 많은 공연이 곧 추가될 예정입니다
          </p>
        </div>
      </div>
    </div>
  );
}
