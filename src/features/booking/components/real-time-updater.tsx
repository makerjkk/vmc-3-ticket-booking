'use client';

import { useEffect, useRef, memo } from 'react';
import { useScheduleSelection } from '../context/schedule-selection-context';
import { useRealTimeSeatCount, useScheduleCacheUtils } from '../hooks/use-schedule-selection';

interface RealTimeUpdaterProps {
  scheduleId: string | null;
  enabled?: boolean;
  onUpdate?: (data: { availableSeats: number; totalSeats: number }) => void;
}

export const RealTimeUpdater = memo<RealTimeUpdaterProps>(({ 
  scheduleId, 
  enabled = true,
  onUpdate 
}) => {
  const {
    updateSeatCountStart,
    updateSeatCountSuccess,
    updateSeatCountFailure,
    showTooltip,
  } = useScheduleSelection();

  const { invalidateSeatCount } = useScheduleCacheUtils();
  const previousDataRef = useRef<{ availableSeats: number; totalSeats: number } | null>(null);
  const notificationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 실시간 좌석 수 조회
  const {
    data: seatCountData,
    isLoading,
    error,
    isRefetching,
  } = useRealTimeSeatCount(scheduleId, enabled && !!scheduleId);

  // 데이터 변화 감지 및 처리
  useEffect(() => {
    if (!seatCountData) return;

    const currentData = {
      availableSeats: seatCountData.availableSeats,
      totalSeats: seatCountData.totalSeats,
    };

    // 이전 데이터와 비교
    if (previousDataRef.current) {
      const prev = previousDataRef.current;
      const hasChanged = prev.availableSeats !== currentData.availableSeats;

      if (hasChanged) {
        // 좌석 수 변화 알림
        const seatDiff = currentData.availableSeats - prev.availableSeats;
        
        if (seatDiff < 0) {
          // 좌석이 줄어든 경우 (다른 사용자가 예약)
          showTooltip({
            visible: true,
            message: `${Math.abs(seatDiff)}석이 예약되었습니다`,
            type: 'info',
          });
        } else if (seatDiff > 0) {
          // 좌석이 늘어난 경우 (취소 발생)
          showTooltip({
            visible: true,
            message: `${seatDiff}석이 취소되어 예약 가능합니다`,
            type: 'info',
          });
        }

        // 매진 상태 변화 알림
        if (prev.availableSeats > 0 && currentData.availableSeats === 0) {
          showTooltip({
            visible: true,
            message: '선택하신 회차가 매진되었습니다',
            type: 'warning',
          });
        } else if (prev.availableSeats === 0 && currentData.availableSeats > 0) {
          showTooltip({
            visible: true,
            message: '좌석이 다시 예약 가능합니다',
            type: 'info',
          });
        }

        // 상태 업데이트
        updateSeatCountSuccess({
          scheduleId: seatCountData.scheduleId,
          availableSeats: currentData.availableSeats,
          totalSeats: currentData.totalSeats,
        });

        // 콜백 호출
        onUpdate?.(currentData);

        // 알림 자동 숨김
        if (notificationTimeoutRef.current) {
          clearTimeout(notificationTimeoutRef.current);
        }
        notificationTimeoutRef.current = setTimeout(() => {
          // showTooltip에서 hideTooltip 호출은 context에서 처리
        }, 3000);
      }
    }

    // 현재 데이터를 이전 데이터로 저장
    previousDataRef.current = currentData;
  }, [seatCountData, updateSeatCountSuccess, showTooltip, onUpdate]);

  // 로딩 상태 동기화
  useEffect(() => {
    if (isLoading || isRefetching) {
      updateSeatCountStart();
    }
  }, [isLoading, isRefetching, updateSeatCountStart]);

  // 에러 처리
  useEffect(() => {
    if (error) {
      updateSeatCountFailure(error as Error);
      
      // 에러 발생 시 캐시 무효화
      if (scheduleId) {
        invalidateSeatCount(scheduleId);
      }
    }
  }, [error, updateSeatCountFailure, scheduleId, invalidateSeatCount]);

  // 컴포넌트 언마운트 시 정리
  useEffect(() => {
    return () => {
      if (notificationTimeoutRef.current) {
        clearTimeout(notificationTimeoutRef.current);
      }
    };
  }, []);

  // 이 컴포넌트는 UI를 렌더링하지 않음 (로직만 처리)
  return null;
});

RealTimeUpdater.displayName = 'RealTimeUpdater';

// 실시간 업데이트 상태 표시 컴포넌트
export const RealTimeStatus = memo<{
  isActive: boolean;
  lastUpdated: Date | null;
  error?: Error | null;
}>(({ isActive, lastUpdated, error }) => {
  const getStatusColor = () => {
    if (error) return 'text-red-500';
    if (isActive) return 'text-green-500';
    return 'text-gray-400';
  };

  const getStatusText = () => {
    if (error) return '업데이트 오류';
    if (isActive) return '실시간 업데이트 중';
    return '업데이트 중지됨';
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    
    const now = new Date();
    const diffMs = now.getTime() - lastUpdated.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    
    if (diffSeconds < 60) {
      return `${diffSeconds}초 전`;
    } else if (diffSeconds < 3600) {
      return `${Math.floor(diffSeconds / 60)}분 전`;
    } else {
      return lastUpdated.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
  };

  return (
    <div className="flex items-center gap-2 text-xs text-gray-500">
      {/* 상태 인디케이터 */}
      <div className="flex items-center gap-1">
        <div className={`w-2 h-2 rounded-full ${getStatusColor().replace('text-', 'bg-')} ${isActive && !error ? 'animate-pulse' : ''}`} />
        <span className={getStatusColor()}>{getStatusText()}</span>
      </div>
      
      {/* 마지막 업데이트 시간 */}
      {lastUpdated && (
        <span>
          · 마지막 업데이트: {formatLastUpdated()}
        </span>
      )}
    </div>
  );
});

RealTimeStatus.displayName = 'RealTimeStatus';
