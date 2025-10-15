'use client';

import React, { memo } from 'react';
import { Check, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Seat, SeatStatus } from '../lib/dto';

interface SeatCellProps {
  seat: Seat;
  status: SeatStatus;
  isSelected: boolean;
  isConflict: boolean;
  isFocused: boolean;
  onClick: (seat: Seat) => void;
  onHover: (seat: Seat | null) => void;
  onKeyDown: (event: React.KeyboardEvent, seat: Seat) => void;
  className?: string;
}

export const SeatCell = memo<SeatCellProps>(({
  seat,
  status,
  isSelected,
  isConflict,
  isFocused,
  onClick,
  onHover,
  onKeyDown,
  className
}) => {
  const handleClick = () => {
    onClick(seat);
  };

  const handleMouseEnter = () => {
    onHover(seat);
  };

  const handleMouseLeave = () => {
    onHover(null);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    onKeyDown(event, seat);
  };

  // 좌석 상태별 스타일 클래스
  const getSeatClasses = () => {
    const baseClasses = [
      'seat-cell',
      'relative',
      'w-8 h-8',
      'rounded-sm',
      'border',
      'flex items-center justify-center',
      'text-xs font-medium',
      'transition-all duration-150 ease-out',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'select-none',
    ];

    // 상태별 스타일
    switch (status) {
      case 'available':
        baseClasses.push(
          'bg-slate-50 border-slate-200 text-slate-700',
          'hover:bg-slate-100 hover:border-slate-300',
          'cursor-pointer',
          'focus:ring-primary'
        );
        break;
      
      case 'selected':
        baseClasses.push(
          'bg-primary border-primary text-primary-foreground',
          'hover:bg-primary/90',
          'cursor-pointer',
          'focus:ring-primary',
          'shadow-sm'
        );
        break;
      
      case 'reserved':
        baseClasses.push(
          'bg-gray-400 border-gray-500 text-gray-100',
          'cursor-not-allowed',
          'opacity-60'
        );
        break;
      
      case 'held':
        baseClasses.push(
          'bg-cyan-100 border-cyan-300 text-cyan-700',
          'cursor-not-allowed',
          'animate-pulse'
        );
        break;
      
      case 'conflict':
        baseClasses.push(
          'bg-red-100 border-red-400 text-red-700',
          'cursor-pointer',
          'animate-bounce',
          'focus:ring-red-500'
        );
        break;
    }

    // 등급별 추가 스타일
    switch (seat.grade) {
      case 'R':
        if (status === 'available') {
          baseClasses.push('ring-1 ring-primary/20');
        }
        break;
      case 'S':
        if (status === 'available') {
          baseClasses.push('ring-1 ring-cyan-500/20');
        }
        break;
      case 'A':
        if (status === 'available') {
          baseClasses.push('ring-1 ring-pink-500/20');
        }
        break;
    }

    // 포커스 상태
    if (isFocused) {
      baseClasses.push('ring-2 ring-primary ring-offset-2');
    }

    // 접근성 관련 스타일
    if (seat.metadata?.isAccessible) {
      baseClasses.push('ring-2 ring-blue-500/50');
    }

    if (seat.metadata?.hasObstruction) {
      baseClasses.push('opacity-75');
    }

    return baseClasses;
  };

  // ARIA 라벨 생성
  const getAriaLabel = () => {
    const baseLabel = `${seat.rowName}열 ${seat.seatIndex}번 좌석, ${seat.grade}석`;
    
    switch (status) {
      case 'available':
        return `${baseLabel}, 선택 가능`;
      case 'selected':
        return `${baseLabel}, 선택됨`;
      case 'reserved':
        return `${baseLabel}, 예약됨`;
      case 'held':
        return `${baseLabel}, 다른 사용자가 선택 중`;
      case 'conflict':
        return `${baseLabel}, 충돌 발생`;
      default:
        return baseLabel;
    }
  };

  // 좌석 번호 표시 (간단한 형태)
  const getSeatDisplayNumber = () => {
    // 좌석 번호가 길면 줄임
    if (seat.seatIndex > 99) {
      return '99+';
    }
    return seat.seatIndex.toString();
  };

  const isDisabled = status === 'reserved' || status === 'held';
  const isClickable = !isDisabled;

  return (
    <button
      type="button"
      className={cn(getSeatClasses(), className)}
      onClick={isClickable ? handleClick : undefined}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      aria-label={getAriaLabel()}
      aria-selected={isSelected}
      aria-disabled={isDisabled}
      role="button"
      tabIndex={isFocused ? 0 : -1}
      data-seat-id={seat.id}
      data-seat-status={status}
      data-seat-grade={seat.grade}
    >
      {/* 좌석 번호 */}
      <span className="seat-number">
        {getSeatDisplayNumber()}
      </span>

      {/* 선택 표시 아이콘 */}
      {isSelected && (
        <Check 
          className="absolute -top-1 -right-1 w-3 h-3 text-white bg-primary rounded-full p-0.5" 
          aria-hidden="true"
        />
      )}

      {/* 충돌 표시 아이콘 */}
      {isConflict && (
        <AlertTriangle 
          className="absolute -top-1 -right-1 w-3 h-3 text-red-600 bg-white rounded-full p-0.5" 
          aria-hidden="true"
        />
      )}

      {/* 접근성 표시 */}
      {seat.metadata?.isAccessible && (
        <div 
          className="absolute -bottom-1 -right-1 w-2 h-2 bg-blue-500 rounded-full"
          aria-hidden="true"
          title="휠체어 접근 가능"
        />
      )}

      {/* 시야 제한 표시 */}
      {seat.metadata?.hasObstruction && (
        <div 
          className="absolute top-0 left-0 w-full h-full bg-black/10 rounded-sm"
          aria-hidden="true"
          title="시야 제한"
        />
      )}
    </button>
  );
});

SeatCell.displayName = 'SeatCell';
