'use client';

import { memo } from 'react';

// 개별 회차 카드 스켈레톤
const ScheduleCardSkeleton = memo(() => (
  <div className="p-4 rounded-lg border-2 border-gray-200 bg-white animate-pulse">
    <div className="space-y-3">
      {/* 시간과 상태 뱃지 */}
      <div className="flex items-center justify-between">
        <div className="h-6 bg-gray-200 rounded w-16"></div>
        <div className="h-5 bg-gray-200 rounded-full w-20"></div>
      </div>

      {/* 좌석 정보 */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="h-4 bg-gray-200 rounded w-12"></div>
          <div className="h-4 bg-gray-200 rounded w-16"></div>
        </div>
        
        {/* 진행률 바 */}
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div className="h-2 bg-gray-300 rounded-full w-3/4"></div>
        </div>
      </div>

      {/* 상대 시간 */}
      <div className="h-3 bg-gray-200 rounded w-12"></div>
    </div>
  </div>
));

ScheduleCardSkeleton.displayName = 'ScheduleCardSkeleton';

// 날짜 선택 스켈레톤
const DateSelectorSkeleton = memo(() => (
  <div className="mb-6">
    <div className="h-4 bg-gray-200 rounded w-16 mb-3"></div>
    <div className="flex gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-16 h-16 bg-gray-200 rounded-lg animate-pulse"></div>
      ))}
    </div>
  </div>
));

DateSelectorSkeleton.displayName = 'DateSelectorSkeleton';

// 회차 목록 헤더 스켈레톤
const ScheduleHeaderSkeleton = memo(() => (
  <div className="flex items-center justify-between mb-4">
    <div className="h-4 bg-gray-200 rounded w-20"></div>
    <div className="h-3 bg-gray-200 rounded w-16"></div>
  </div>
));

ScheduleHeaderSkeleton.displayName = 'ScheduleHeaderSkeleton';

// 메인 스켈레톤 컴포넌트
export const ScheduleLoadingSkeleton = memo(() => {
  return (
    <div className="space-y-6">
      {/* 날짜 선택 스켈레톤 */}
      <DateSelectorSkeleton />

      {/* 회차 목록 스켈레톤 */}
      <div>
        <ScheduleHeaderSkeleton />
        
        {/* 회차 카드들 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ScheduleCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* 추가 로딩 인디케이터 */}
      <div className="flex justify-center py-4">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>회차 정보를 불러오는 중...</span>
        </div>
      </div>
    </div>
  );
});

ScheduleLoadingSkeleton.displayName = 'ScheduleLoadingSkeleton';

// 간단한 로딩 스피너 (다른 곳에서도 사용 가능)
export const LoadingSpinner = memo<{ size?: 'sm' | 'md' | 'lg'; className?: string }>(({ 
  size = 'md', 
  className = '' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <svg 
      className={`animate-spin ${sizeClasses[size]} ${className}`} 
      fill="none" 
      viewBox="0 0 24 24"
    >
      <circle 
        className="opacity-25" 
        cx="12" 
        cy="12" 
        r="10" 
        stroke="currentColor" 
        strokeWidth="4"
      />
      <path 
        className="opacity-75" 
        fill="currentColor" 
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
});

LoadingSpinner.displayName = 'LoadingSpinner';

// 인라인 로딩 텍스트
export const LoadingText = memo<{ text?: string; className?: string }>(({ 
  text = '로딩 중...', 
  className = '' 
}) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <LoadingSpinner size="sm" />
    <span className="text-sm text-gray-600">{text}</span>
  </div>
));

LoadingText.displayName = 'LoadingText';
