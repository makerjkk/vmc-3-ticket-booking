'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Loader2, Calendar, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ConcertItem } from '@/features/concerts/lib/dto';

interface ConcertCardProps {
  concert: ConcertItem;
  isLoading?: boolean;
  onBookingClick: () => void;
  className?: string;
}

export function ConcertCard({
  concert,
  isLoading = false,
  onBookingClick,
  className,
}: ConcertCardProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const handleImageError = () => {
    setImageError(true);
    setImageLoading(false);
  };

  const handleImageLoad = () => {
    setImageLoading(false);
  };

  return (
    <div
      className={cn(
        'group w-full max-w-sm mx-auto overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-200',
        'hover:shadow-xl hover:-translate-y-2 hover:border-secondary/50',
        'focus-within:ring-2 focus-within:ring-secondary focus-within:ring-offset-2 focus-within:ring-offset-background',
        className
      )}
      style={{ backgroundColor: '#1F2937' }}
    >
      {/* 포스터 이미지 */}
      <div className="relative w-full h-80 overflow-hidden bg-muted">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        )}
        
        {!imageError ? (
          <Image
            src={concert.posterImageUrl}
            alt={`${concert.title} 포스터`}
            width={400}
            height={600}
            className={cn(
              'w-full h-full object-cover transition-transform duration-300 group-hover:scale-105',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onError={handleImageError}
            onLoad={handleImageLoad}
            loading="lazy"
            sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-muted">
            <div className="text-center">
              <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">이미지를 불러올 수 없습니다</p>
            </div>
          </div>
        )}

        {/* 예매 가능 상태 배지 */}
        {concert.hasAvailableSchedules && (
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center rounded-full bg-green-600 backdrop-blur-sm px-3 py-1 text-xs font-medium text-white border border-green-500">
              예매 가능
            </span>
          </div>
        )}
      </div>

      {/* 콘서트 정보 */}
      <div className="p-6">
        {/* 제목 */}
        <h3 className="mb-3 line-clamp-2 text-xl font-semibold text-card-foreground group-hover:text-primary transition-colors">
          {concert.title}
        </h3>

        {/* 부가 정보 */}
        <div className="mb-6 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 text-secondary" />
            <span>공연장 정보</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4 text-secondary" />
            <span>공연 일정</span>
          </div>
        </div>

        {/* 예매하기 버튼 */}
        <Button
          onClick={onBookingClick}
          disabled={isLoading || !concert.hasAvailableSchedules}
          className={cn(
            'w-full transition-all duration-200 font-medium',
            concert.hasAvailableSchedules 
              ? 'bg-white hover:bg-gray-100 text-gray-900 shadow-lg hover:shadow-xl border border-gray-200'
              : 'bg-gray-600 text-gray-300 cursor-not-allowed',
            isLoading && 'bg-gray-600 text-gray-300'
          )}
          aria-label={`${concert.title} 예매하기`}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              확인 중...
            </>
          ) : concert.hasAvailableSchedules ? (
            <>
              <span>예매하기</span>
              <div className="ml-2 w-1 h-1 bg-primary rounded-full animate-pulse"></div>
            </>
          ) : (
            '예매 종료'
          )}
        </Button>
      </div>
    </div>
  );
}
