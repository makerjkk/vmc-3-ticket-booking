'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface LoadingSkeletonProps {
  count?: number;
  className?: string;
}

function SkeletonCard() {
  return (
    <div className="animate-pulse w-full max-w-sm mx-auto">
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        {/* 포스터 이미지 스켈레톤 */}
        <div className="w-full h-80 bg-muted" />
        
        {/* 콘텐츠 영역 */}
        <div className="p-6 space-y-4">
          {/* 제목 스켈레톤 */}
          <div className="space-y-3">
            <div className="h-6 bg-muted rounded w-3/4" />
            <div className="h-6 bg-muted rounded w-1/2" />
          </div>
          
          {/* 부가 정보 스켈레톤 */}
          <div className="space-y-2">
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </div>
          
          {/* 버튼 스켈레톤 */}
          <div className="h-11 bg-muted rounded-lg w-full" />
        </div>
      </div>
    </div>
  );
}

export function LoadingSkeleton({ count = 6, className }: LoadingSkeletonProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8',
        className
      )}
      aria-label="콘서트 목록 로딩 중"
    >
      {Array.from({ length: count }, (_, index) => (
        <SkeletonCard key={index} />
      ))}
    </div>
  );
}
