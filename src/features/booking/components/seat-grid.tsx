'use client';

import { memo, useCallback, useMemo } from 'react';
import { useScheduleSelection } from '../context/schedule-selection-context';
import { SessionManager } from '../lib/session-manager';
import type { SeatData } from '../lib/dto';

interface SeatGridProps {
  seats: SeatData[];
  selectedSeats: string[];
}

// 개별 좌석 컴포넌트
const SeatCell = memo<{
  seat: SeatData;
  isSelected: boolean;
  onClick: (seatId: string) => void;
}>(({ seat, isSelected, onClick }) => {
  const getSeatStyle = () => {
    if (seat.status === 'reserved') {
      return 'bg-gray-400 border-gray-400 cursor-not-allowed text-white';
    }
    
    if (isSelected) {
      return 'bg-blue-600 border-blue-600 text-white shadow-md transform scale-110';
    }
    
    // 등급별 색상
    const gradeColors = {
      'R': 'bg-red-50 border-red-300 hover:bg-red-100 text-red-800',
      'S': 'bg-blue-50 border-blue-300 hover:bg-blue-100 text-blue-800',
      'A': 'bg-green-50 border-green-300 hover:bg-green-100 text-green-800',
    };
    
    return `${gradeColors[seat.grade]} cursor-pointer transition-all duration-200`;
  };

  const handleClick = () => {
    if (seat.status === 'reserved') {
      return;
    }
    onClick(seat.id);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleClick();
    }
  };

  return (
    <button
      className={`
        w-8 h-8 rounded border-2 text-xs font-medium transition-all duration-200
        ${getSeatStyle()}
        ${seat.status === 'available' ? 'hover:shadow-sm' : ''}
      `}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={seat.status === 'reserved'}
      aria-label={`
        ${seat.grade}석 ${seat.seatNumber}, 
        ${seat.price.toLocaleString()}원,
        ${seat.status === 'reserved' ? '매진' : isSelected ? '선택됨' : '선택 가능'}
      `}
      aria-pressed={isSelected}
      title={`${seat.grade}석 ${seat.seatNumber} - ${seat.price.toLocaleString()}원`}
    >
      {seat.seatNumber.slice(-2)} {/* 좌석 번호의 마지막 2자리만 표시 */}
    </button>
  );
});

SeatCell.displayName = 'SeatCell';

// 좌석 행 컴포넌트
const SeatRow = memo<{
  rowSeats: SeatData[];
  selectedSeats: string[];
  onSeatClick: (seatId: string) => void;
  rowLabel: string;
}>(({ rowSeats, selectedSeats, onSeatClick, rowLabel }) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      {/* 행 라벨 */}
      <div className="w-6 text-center text-sm font-medium text-gray-600">
        {rowLabel}
      </div>
      
      {/* 좌석들 */}
      <div className="flex gap-1">
        {rowSeats.map((seat) => (
          <SeatCell
            key={seat.id}
            seat={seat}
            isSelected={selectedSeats.includes(seat.id)}
            onClick={onSeatClick}
          />
        ))}
      </div>
    </div>
  );
});

SeatRow.displayName = 'SeatRow';

// 메인 좌석 그리드 컴포넌트
export const SeatGrid = memo<SeatGridProps>(({ seats, selectedSeats }) => {
  const {
    selectSeat,
    deselectSeat,
    showTooltip,
    hideTooltip,
  } = useScheduleSelection();

  // 좌석 클릭 핸들러
  const handleSeatClick = useCallback((seatId: string) => {
    const seat = seats.find(s => s.id === seatId);
    if (!seat) return;

    if (seat.status === 'reserved') {
      showTooltip({
        visible: true,
        message: '이미 예약된 좌석입니다',
        type: 'warning',
      });
      return;
    }

    const isCurrentlySelected = selectedSeats.includes(seatId);
    
    if (isCurrentlySelected) {
      // 좌석 선택 해제
      deselectSeat(seatId);
      SessionManager.removeSeat(seatId);
    } else {
      // 최대 4석 제한 확인
      if (selectedSeats.length >= 4) {
        showTooltip({
          visible: true,
          message: '최대 4석까지만 선택할 수 있습니다',
          type: 'warning',
        });
        return;
      }

      // 좌석 선택
      selectSeat(seatId);
      SessionManager.addSeat(seatId);
    }

    // 툴팁 자동 숨김
    setTimeout(() => {
      hideTooltip();
    }, 2000);
  }, [seats, selectedSeats, selectSeat, deselectSeat, showTooltip, hideTooltip]);

  // 좌석을 행별로 그룹화
  const seatsByRow = useMemo(() => {
    const grouped = new Map<string, SeatData[]>();
    
    seats.forEach(seat => {
      // 좌석 번호에서 행 추출 (예: A01 -> A, B05 -> B)
      const row = seat.seatNumber.charAt(0);
      
      if (!grouped.has(row)) {
        grouped.set(row, []);
      }
      grouped.get(row)!.push(seat);
    });

    // 각 행의 좌석을 번호순으로 정렬
    grouped.forEach((rowSeats) => {
      rowSeats.sort((a, b) => {
        const aNum = parseInt(a.seatNumber.slice(1));
        const bNum = parseInt(b.seatNumber.slice(1));
        return aNum - bNum;
      });
    });

    // 행을 알파벳순으로 정렬
    return new Map([...grouped.entries()].sort());
  }, [seats]);

  // 좌석이 없는 경우
  if (seats.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">좌석 정보가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 좌석 그리드 */}
      <div className="max-w-full overflow-x-auto">
        <div className="min-w-max">
          {Array.from(seatsByRow.entries()).map(([rowLabel, rowSeats]) => (
            <SeatRow
              key={rowLabel}
              rowSeats={rowSeats}
              selectedSeats={selectedSeats}
              onSeatClick={handleSeatClick}
              rowLabel={rowLabel}
            />
          ))}
        </div>
      </div>

      {/* 좌석 통계 */}
      <div className="flex justify-center gap-6 text-sm text-gray-600 pt-4 border-t">
        <div className="text-center">
          <div className="font-medium text-gray-900">
            {seats.filter(s => s.status === 'available').length}
          </div>
          <div>선택 가능</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-blue-600">
            {selectedSeats.length}
          </div>
          <div>선택됨</div>
        </div>
        <div className="text-center">
          <div className="font-medium text-gray-500">
            {seats.filter(s => s.status === 'reserved').length}
          </div>
          <div>매진</div>
        </div>
      </div>

      {/* 키보드 사용 안내 */}
      <div className="text-xs text-gray-500 text-center">
        키보드의 Tab 키로 좌석을 이동하고, Enter 또는 Space 키로 선택할 수 있습니다.
      </div>
    </div>
  );
});

SeatGrid.displayName = 'SeatGrid';
