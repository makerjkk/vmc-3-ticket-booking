'use client';

import { memo } from 'react';
import { useRouter } from 'next/navigation';
import type { ScheduleItem } from '../lib/dto';
import { DateTimeUtils } from '../lib/datetime-utils';

interface ScheduleCardProps {
  schedule: ScheduleItem;
  isSelected: boolean;
  onClick: () => void;
  concertId?: string; // 좌석 선택 페이지로 이동하기 위해 추가
}

export const ScheduleCard = memo<ScheduleCardProps>(({ 
  schedule, 
  isSelected, 
  onClick,
  concertId
}) => {
  const router = useRouter();
  const scheduleTime = DateTimeUtils.formatScheduleTime(schedule.dateTime);
  const relativeTime = DateTimeUtils.getRelativeTime(schedule.dateTime);
  const isPast = DateTimeUtils.isPastSchedule(schedule.dateTime);
  
  // 상태별 스타일 결정
  const getCardStyle = () => {
    if (isPast) {
      return 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60';
    }
    
    if (schedule.isSoldOut) {
      return 'bg-gray-50 border-gray-200 cursor-not-allowed';
    }
    
    if (isSelected) {
      return 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-105';
    }
    
    if (schedule.isAlmostSoldOut) {
      return 'bg-white border-orange-300 hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-all duration-200';
    }
    
    return 'bg-white border-gray-200 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all duration-200';
  };

  // 상태별 텍스트 색상
  const getTextColor = () => {
    if (isPast || schedule.isSoldOut) {
      return 'text-gray-400';
    }
    
    if (isSelected) {
      return 'text-white';
    }
    
    return 'text-gray-900';
  };

  // 좌석 수 표시 색상
  const getSeatCountColor = () => {
    if (isPast || schedule.isSoldOut) {
      return 'text-gray-400';
    }
    
    if (isSelected) {
      return 'text-blue-100';
    }
    
    if (schedule.isAlmostSoldOut) {
      return 'text-orange-600';
    }
    
    return 'text-gray-600';
  };

  // 상태 뱃지
  const renderStatusBadge = () => {
    if (isPast) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-200 text-gray-600">
          시간 지남
        </span>
      );
    }
    
    if (schedule.isSoldOut) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          SOLD OUT
        </span>
      );
    }
    
    if (schedule.isAlmostSoldOut) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
          잔여 {schedule.availableSeats}석
        </span>
      );
    }
    
    return null;
  };

  // 클릭 핸들러
  const handleClick = () => {
    if (isPast || schedule.isSoldOut) {
      return;
    }
    
    // 기존 onClick 호출 (상태 업데이트용)
    onClick();
    
    // 좌석 선택 페이지로 이동
    if (concertId) {
      router.push(`/booking/${concertId}/seats?scheduleId=${schedule.id}`);
    }
  };

  // 키보드 핸들러
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <div
      className={`
        relative p-4 rounded-lg border-2 transition-all duration-200
        ${getCardStyle()}
        ${!isPast && !schedule.isSoldOut ? 'hover:shadow-md' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      tabIndex={!isPast && !schedule.isSoldOut ? 0 : -1}
      role="button"
      aria-label={`
        ${scheduleTime} 회차, 
        ${schedule.isSoldOut ? '매진' : `잔여 ${schedule.availableSeats}석`},
        ${isSelected ? '선택됨' : ''}
      `}
      aria-pressed={isSelected}
      aria-disabled={isPast || schedule.isSoldOut}
    >
      {/* 선택 표시 아이콘 */}
      {isSelected && (
        <div className="absolute top-2 right-2">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* 메인 콘텐츠 */}
      <div className="space-y-3">
        {/* 시간 */}
        <div className="flex items-center justify-between">
          <h3 className={`text-lg font-semibold ${getTextColor()}`}>
            {scheduleTime}
          </h3>
          {renderStatusBadge()}
        </div>

        {/* 좌석 정보 */}
        <div className={`text-sm ${getSeatCountColor()}`}>
          <div className="flex items-center justify-between">
            <span>
              잔여 좌석
            </span>
            <span className="font-medium">
              {schedule.availableSeats} / {schedule.totalSeats}
            </span>
          </div>
          
          {/* 진행률 바 */}
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className={`
                h-2 rounded-full transition-all duration-300
                ${schedule.isSoldOut ? 'bg-red-500' : 
                  schedule.isAlmostSoldOut ? 'bg-orange-500' : 
                  isSelected ? 'bg-white' : 'bg-blue-500'
                }
              `}
              style={{
                width: `${Math.max(5, (schedule.availableSeats / schedule.totalSeats) * 100)}%`
              }}
            />
          </div>
        </div>

        {/* 상대 시간 */}
        <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
          {relativeTime}
        </div>
      </div>

      {/* 호버 효과 */}
      {!isPast && !schedule.isSoldOut && !isSelected && (
        <div className="absolute inset-0 rounded-lg bg-blue-600 opacity-0 hover:opacity-5 transition-opacity duration-200" />
      )}
    </div>
  );
});

ScheduleCard.displayName = 'ScheduleCard';
