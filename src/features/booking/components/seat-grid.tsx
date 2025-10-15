'use client';

import React, { memo, useMemo } from 'react';
import { useSeatGrid } from '../hooks/use-seat-grid';
import { useSeatSelection } from '../context/seat-selection-context';
import { SeatCell } from './seat-cell';
import { groupSeatsByRow } from '../lib/seat-utils';
import type { Seat } from '../lib/dto';

interface SeatGridProps {
  className?: string;
}

// 좌석 행 컴포넌트
const SeatRow = memo<{
  rowName: string;
  seats: Seat[];
  seatStatusMap: Record<string, any>;
  focusedSeatId: string | null;
  onSeatClick: (seat: Seat) => void;
  onSeatHover: (seat: Seat | null) => void;
  onSeatKeyDown: (event: React.KeyboardEvent, seat: Seat) => void;
  getSeatAriaLabel: (seat: Seat) => string;
  getSeatClassName: (seat: Seat) => string;
}>(({ 
  rowName, 
  seats, 
  seatStatusMap, 
  focusedSeatId, 
  onSeatClick, 
  onSeatHover, 
  onSeatKeyDown,
  getSeatAriaLabel,
  getSeatClassName
}) => {
  return (
    <div className="flex items-center gap-1.5 mb-1" role="row">
      {/* 행 라벨 */}
      <div className="w-7 text-center text-sm font-semibold text-gray-700 flex-shrink-0">
        {rowName}
      </div>
      
      {/* 좌석들 */}
      <div className="flex gap-0.5" role="presentation">
        {seats.map((seat) => {
          const status = seatStatusMap[seat.id] || 'available';
          const isSelected = status === 'selected';
          const isConflict = status === 'conflict';
          const isFocused = focusedSeatId === seat.id;

          return (
            <SeatCell
              key={seat.id}
              seat={seat}
              status={status}
              isSelected={isSelected}
              isConflict={isConflict}
              isFocused={isFocused}
              onClick={onSeatClick}
              onHover={onSeatHover}
              onKeyDown={onSeatKeyDown}
              className={getSeatClassName(seat)}
            />
          );
        })}
      </div>
    </div>
  );
});

SeatRow.displayName = 'SeatRow';

// 메인 좌석 그리드 컴포넌트
export const SeatGrid = memo<SeatGridProps>(({ className }) => {
  const {
    seats,
    selectedSeats,
    conflictSeats,
    focusedSeatId,
    isLoading,
    onSeatClick,
    onSeatHover,
    onSeatFocus,
    onSeatKeyDown,
    seatStatusMap,
    getSeatAriaLabel,
    getSeatClassName,
    isSeatSelectable,
  } = useSeatGrid();

  // 좌석을 행별로 그룹화
  const seatRows = useMemo(() => {
    return groupSeatsByRow(seats);
  }, [seats]);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2 text-sm text-gray-600">좌석 정보를 불러오는 중...</span>
      </div>
    );
  }

  // 에러 상태 확인
  const { state } = useSeatSelection();
  
  // 에러가 있는 경우
  if (state.core.error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-500 mb-4">
          <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm font-medium">좌석 정보를 불러올 수 없습니다</p>
        </div>
        <p className="text-xs text-gray-600 mb-4">{state.core.error}</p>
        <div className="space-y-2">
          <button
            onClick={() => {
              const concertId = window.location.pathname.split('/')[2];
              window.location.href = `/booking/${concertId}`;
            }}
            className="px-4 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary/90 transition-colors mr-2"
          >
            회차 다시 선택하기
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-gray-500 text-white rounded-md text-sm hover:bg-gray-600 transition-colors"
          >
            메인으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // 좌석이 없는 경우
  if (seats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <p className="text-sm">좌석 정보가 없습니다</p>
        <p className="text-xs mt-1">회차를 먼저 선택해주세요</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 좌석 그리드 */}
      <div className="bg-white rounded-lg border p-4">
        {/* 무대 표시 */}
        <div className="mb-6">
          <div className="w-full h-2 bg-gradient-to-r from-transparent via-gray-300 to-transparent rounded-full mb-2"></div>
          <div className="text-center text-xs text-gray-500">공연 무대</div>
        </div>

        {/* 좌석 배치 */}
        <div 
          className="w-full overflow-x-auto overflow-y-hidden"
          role="grid"
          aria-label="좌석 선택 그리드"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E0 #F7FAFC',
          }}
        >
          <div className="inline-block min-w-full space-y-1 pb-2">
            {seatRows.map((row) => (
              <SeatRow
                key={row.rowName}
                rowName={row.rowName}
                seats={row.seats}
                seatStatusMap={seatStatusMap}
                focusedSeatId={focusedSeatId}
                onSeatClick={onSeatClick}
                onSeatHover={onSeatHover}
                onSeatKeyDown={onSeatKeyDown}
                getSeatAriaLabel={getSeatAriaLabel}
                getSeatClassName={getSeatClassName}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 좌석 범례 */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="text-sm font-medium text-gray-900 mb-3">좌석 등급 및 상태</h3>
        
        {/* 등급별 범례 */}
        <div className="grid grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-purple-200 border-2 border-purple-400 rounded"></div>
            <span className="text-sm text-gray-700 font-medium">R석 (이코노미)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-cyan-200 border-2 border-cyan-400 rounded"></div>
            <span className="text-sm text-gray-700 font-medium">S석 (스탠다드)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-amber-200 border-2 border-amber-400 rounded"></div>
            <span className="text-sm text-gray-700 font-medium">A석 (프리미엄)</span>
          </div>
        </div>

        {/* 상태별 범례 */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-green-600 border-2 border-green-400 rounded shadow-sm"></div>
            <span className="text-sm text-gray-700 font-medium">선택됨</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-4 bg-gray-400 border-2 border-gray-500 rounded"></div>
            <span className="text-sm text-gray-700 font-medium">예약됨</span>
          </div>
        </div>
      </div>

      {/* 좌석 통계 */}
      <div className="grid grid-cols-4 gap-4 text-center">
        <div className="bg-white rounded-lg border p-3">
          <div className="text-lg font-semibold text-gray-900">
            {seats.filter(s => s.status === 'available').length}
          </div>
          <div className="text-xs text-gray-600">선택 가능</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-lg font-semibold text-green-600">
            {selectedSeats.length}
          </div>
          <div className="text-xs text-gray-600">선택됨</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-lg font-semibold text-gray-500">
            {seats.filter(s => s.status === 'reserved').length}
          </div>
          <div className="text-xs text-gray-600">예약됨</div>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <div className="text-lg font-semibold text-red-600">
            {conflictSeats.length}
          </div>
          <div className="text-xs text-gray-600">충돌</div>
        </div>
      </div>

      {/* 키보드 사용 안내 */}
      <div className="text-xs text-gray-500 text-center bg-gray-50 rounded-lg p-3">
        <p>💡 키보드 사용법: 화살표 키로 이동, Enter/Space로 선택, Esc로 포커스 해제</p>
      </div>
    </div>
  );
});

SeatGrid.displayName = 'SeatGrid';
