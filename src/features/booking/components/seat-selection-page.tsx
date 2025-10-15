'use client';

import React, { memo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SeatSelectionProvider } from '../context/seat-selection-context';
import { BookingCompletionProvider } from '../context/booking-completion-context';
import { SeatGrid } from './seat-grid';
import { BookingInfo } from './booking-info';
import { CompleteButton } from './complete-button';
import { SeatSelectionTooltip } from './seat-selection-tooltip';
import { SeatSelectionAlert } from './seat-selection-alert';
import { useSeatSync } from '../hooks/use-seat-sync';
import { cn } from '@/lib/utils';
import type { Seat } from '../lib/dto';

interface SeatSelectionPageProps {
  scheduleId: string;
  concertId: string;
  className?: string;
}

// 실시간 동기화 컴포넌트 (Provider 내부에서 사용)
const SeatSyncHandler = memo<{ scheduleId: string }>(({ scheduleId }) => {
  const {
    startPolling,
    stopPolling,
    forceSync,
    onConflictDetected,
    onConnectionChange,
    isConnected,
    getTimeSinceLastSync,
  } = useSeatSync(scheduleId, {
    interval: 3000, // 3초마다 동기화
    maxRetries: 3,
    autoStart: true,
    onError: (error) => {
      console.error('Seat sync error:', error);
    },
  });

  // 충돌 감지 시 처리
  useEffect(() => {
    const unsubscribe = onConflictDetected((conflictSeats) => {
      console.log('Seat conflicts detected:', conflictSeats);
      // 추가 처리 로직 (예: 사용자에게 알림)
    });

    return unsubscribe;
  }, [onConflictDetected]);

  // 연결 상태 변화 시 처리
  useEffect(() => {
    const unsubscribe = onConnectionChange((status) => {
      console.log('Connection status changed:', status);
      // 연결 상태에 따른 UI 업데이트 로직
    });

    return unsubscribe;
  }, [onConnectionChange]);

  // 페이지 포커스 시 강제 동기화
  useEffect(() => {
    const handleFocus = () => {
      if (isConnected()) {
        forceSync().catch(error => {
          console.error('Focus sync error:', error);
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [forceSync, isConnected]);

  return null;
});

SeatSyncHandler.displayName = 'SeatSyncHandler';

// 메인 페이지 컴포넌트
export const SeatSelectionPage = memo<SeatSelectionPageProps>(({
  scheduleId,
  concertId,
  className,
}) => {
  const router = useRouter();

  // 좌석 선택 완료 핸들러
  const handleSelectionComplete = (seats: Seat[]) => {
    // 좌석 선택 완료 시 자동 이동하지 않음
    // 사용자가 "좌석 선택 완료" 버튼을 클릭하면 모달이 열립니다
    console.log('Seats selected:', seats.length);
  };

  // 에러 핸들러
  const handleError = (error: Error) => {
    console.error('Seat selection error:', error);
    // 에러 로깅 또는 추가 처리
  };

  // 충돌 감지 핸들러
  const handleConflictDetected = (conflictSeats: string[]) => {
    console.log('Conflict detected for seats:', conflictSeats);
    // 사용자에게 알림 표시 등 추가 처리
  };

  return (
    <SeatSelectionProvider
      scheduleId={scheduleId}
      config={{
        maxSeats: 4,
        pollingInterval: 3000,
        autoSave: true,
        enableWebSocket: false,
        enableAnalytics: false,
      }}
      onError={handleError}
      onSelectionComplete={handleSelectionComplete}
      onConflictDetected={handleConflictDetected}
    >
      <BookingCompletionProvider>
        <div className={cn('min-h-screen bg-gray-50', className)}>
          {/* 실시간 동기화 핸들러 */}
          <SeatSyncHandler scheduleId={scheduleId} />

          {/* 메인 컨텐츠 */}
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* 좌석 그리드 (좌측 2/3) */}
              <div className="lg:col-span-2">
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      좌석 선택
                    </h1>
                    <p className="text-sm text-gray-600">
                      원하시는 좌석을 선택해주세요 (최대 4석)
                    </p>
                  </div>

                  <SeatGrid />
                </div>
              </div>

              {/* 예약 정보 및 완료 버튼 (우측 1/3) */}
              <div className="space-y-4">
                {/* 예약 정보 */}
                <BookingInfo scheduleId={scheduleId} />

                {/* 완료 버튼 */}
                <CompleteButton scheduleId={scheduleId} />
              </div>
            </div>
          </div>

          {/* 전역 UI 컴포넌트들 */}
          <SeatSelectionTooltip />
          <SeatSelectionAlert />
        </div>
      </BookingCompletionProvider>
    </SeatSelectionProvider>
  );
});

SeatSelectionPage.displayName = 'SeatSelectionPage';
