'use client';

import React from 'react';
import { useConcertInfo } from '../hooks/use-concert-info';

interface ConcertInfoHeaderProps {
  concertId: string;
}

// 로딩 스켈레톤 컴포넌트
function ConcertInfoSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 포스터 스켈레톤 */}
        <div className="flex-shrink-0">
          <div className="w-32 h-48 bg-gray-200 rounded-lg animate-pulse"></div>
        </div>
        
        {/* 정보 스켈레톤 */}
        <div className="flex-1 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse"></div>
          <div className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6 animate-pulse"></div>
            <div className="h-4 bg-gray-200 rounded w-4/6 animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-6 w-16 bg-gray-200 rounded-full animate-pulse"></div>
            <div className="h-6 w-20 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 에러 상태 컴포넌트
function ConcertInfoError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          콘서트 정보를 불러올 수 없습니다
        </h3>
        <p className="text-gray-600 mb-4">
          네트워크 연결을 확인하고 다시 시도해주세요.
        </p>
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    </div>
  );
}

// 메인 콘서트 정보 헤더 컴포넌트
export function ConcertInfoHeader({ concertId }: ConcertInfoHeaderProps) {
  const { data: concertInfo, isLoading, error, refetch } = useConcertInfo(concertId);

  // 로딩 상태
  if (isLoading) {
    return <ConcertInfoSkeleton />;
  }

  // 에러 상태
  if (error || !concertInfo) {
    return <ConcertInfoError onRetry={() => refetch()} />;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
      <div className="flex flex-col md:flex-row gap-6">
        {/* 포스터 이미지 */}
        <div className="flex-shrink-0">
          <div className="w-32 h-48 rounded-lg overflow-hidden bg-gray-100">
            {concertInfo.posterImageUrl ? (
              <img
                src={concertInfo.posterImageUrl}
                alt={`${concertInfo.title} 포스터`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // 이미지 로드 실패 시 기본 이미지로 대체
                  const target = e.target as HTMLImageElement;
                  target.src = 'https://picsum.photos/seed/default-concert/320/480';
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
            )}
          </div>
        </div>
        
        {/* 콘서트 정보 */}
        <div className="flex-1">
          <div className="space-y-4">
            {/* 제목 */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
              {concertInfo.title}
            </h1>
            
            {/* 설명 */}
            {concertInfo.description && (
              <p className="text-gray-600 leading-relaxed">
                {concertInfo.description}
              </p>
            )}
            
            {/* 메타 정보 */}
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                예매 진행중
              </span>
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                실시간 예매
              </span>
            </div>
            
            {/* 예매 안내 */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-blue-900 mb-1">예매 안내</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• 날짜와 회차를 선택한 후 좌석을 선택해주세요</li>
                    <li>• 최대 4석까지 한 번에 예매 가능합니다</li>
                    <li>• 선택된 좌석은 5분간 임시 예약됩니다</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
