'use client';

import { useEffect, useState } from 'react';
import { useScheduleSelection } from '../context/schedule-selection-context';
import { useSchedulesByDate } from '../hooks/use-schedule-selection';
import { ScheduleCard } from './schedule-card';
import { ScheduleLoadingSkeleton } from './schedule-loading-skeleton';
import { ScheduleErrorMessage } from './schedule-error-message';
import { SessionManager } from '../lib/session-manager';
import { DateTimeUtils } from '../lib/datetime-utils';

// 날짜 선택 컴포넌트
function DateSelector({ 
  selectedDate, 
  onDateSelect 
}: { 
  selectedDate: string | null; 
  onDateSelect: (date: string) => void;
}) {
  // 예시로 다음 7일간의 날짜 생성 (실제로는 콘서트별 예매 가능 날짜를 가져와야 함)
  const availableDates = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i);
    return DateTimeUtils.formatDate(date);
  });

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">날짜 선택</h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {availableDates.map((date) => {
          const isSelected = selectedDate === date;
          const dayOfWeek = DateTimeUtils.getDayOfWeekKorean(date);
          const formattedDate = DateTimeUtils.formatDateKorean(date);
          
          return (
            <button
              key={date}
              onClick={() => onDateSelect(date)}
              className={`
                flex-shrink-0 px-4 py-3 rounded-lg border text-sm font-medium transition-all
                ${isSelected 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                }
              `}
            >
              <div className="text-center">
                <div className="font-medium">{dayOfWeek}</div>
                <div className="text-xs opacity-75 mt-1">
                  {formattedDate.split(' ')[2]} {/* 일만 표시 */}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// 회차 목록 컴포넌트
export function ScheduleList() {
  const {
    state,
    selectDate,
    selectSchedule,
    loadSchedulesStart,
    loadSchedulesSuccess,
    loadSchedulesFailure,
    showTooltip,
    hideTooltip,
  } = useScheduleSelection();

  const [concertId] = useState(() => {
    // 세션에서 concertId 가져오기
    const sessionData = SessionManager.load();
    return sessionData?.concertId || '';
  });

  // React Query로 회차 데이터 페칭
  const {
    data: schedulesResponse,
    isLoading,
    error,
    refetch,
  } = useSchedulesByDate(
    concertId,
    state.selectedDate,
    !!state.selectedDate && !!concertId
  );

  // 날짜 선택 핸들러
  const handleDateSelect = (date: string) => {
    selectDate(date);
    SessionManager.saveSelectedDate(concertId, date);
  };

  // 회차 선택 핸들러
  const handleScheduleSelect = (scheduleId: string) => {
    const schedule = state.schedules?.find(s => s.id === scheduleId);
    
    if (!schedule) {
      showTooltip({
        visible: true,
        message: '회차 정보를 찾을 수 없습니다',
        type: 'error',
      });
      return;
    }

    // 매진 체크
    if (schedule.isSoldOut) {
      showTooltip({
        visible: true,
        message: '매진된 회차입니다',
        type: 'warning',
      });
      return;
    }

    // 과거 시간 체크
    if (DateTimeUtils.isPastSchedule(schedule.dateTime)) {
      showTooltip({
        visible: true,
        message: '선택하신 회차의 예매 시간이 지났습니다',
        type: 'warning',
      });
      return;
    }

    selectSchedule(scheduleId);
    SessionManager.saveSelectedSchedule(scheduleId);
    
    // 성공 메시지
    setTimeout(() => {
      hideTooltip();
    }, 2000);
  };

  // 로딩 상태 동기화
  useEffect(() => {
    if (isLoading) {
      loadSchedulesStart();
    } else if (schedulesResponse) {
      loadSchedulesSuccess(schedulesResponse.schedules);
    } else if (error) {
      loadSchedulesFailure(error as Error);
    }
  }, [isLoading, schedulesResponse, error, loadSchedulesStart, loadSchedulesSuccess, loadSchedulesFailure]);

  // 세션 복원
  useEffect(() => {
    const sessionData = SessionManager.load();
    if (sessionData?.selectedDate && !state.selectedDate) {
      selectDate(sessionData.selectedDate);
    }
  }, [selectDate, state.selectedDate]);

  // 툴팁 자동 숨김
  useEffect(() => {
    if (state.tooltipState?.visible) {
      const timer = setTimeout(() => {
        hideTooltip();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.tooltipState, hideTooltip]);

  return (
    <div className="space-y-6">
      {/* 날짜 선택 */}
      <DateSelector 
        selectedDate={state.selectedDate}
        onDateSelect={handleDateSelect}
      />

      {/* 회차 목록 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-700">
            회차 선택
            {state.selectedDate && (
              <span className="ml-2 text-xs text-gray-500">
                ({DateTimeUtils.formatDateKorean(state.selectedDate)})
              </span>
            )}
          </h3>
          {state.schedules && state.schedules.length > 0 && (
            <span className="text-xs text-gray-500">
              총 {state.schedules.length}개 회차
            </span>
          )}
        </div>

        {/* 날짜 미선택 상태 */}
        {!state.selectedDate && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-sm">먼저 날짜를 선택해주세요</p>
          </div>
        )}

        {/* 로딩 상태 */}
        {state.selectedDate && isLoading && (
          <ScheduleLoadingSkeleton />
        )}

        {/* 에러 상태 */}
        {state.selectedDate && error && (
          <ScheduleErrorMessage 
            error={error as Error}
            onRetry={() => refetch()}
          />
        )}

        {/* 회차 없음 */}
        {state.selectedDate && !isLoading && !error && (!state.schedules || state.schedules.length === 0) && (
          <div className="text-center py-12 text-gray-500">
            <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm">해당 날짜에 예매 가능한 회차가 없습니다</p>
            <p className="text-xs text-gray-400 mt-1">다른 날짜를 선택해보세요</p>
          </div>
        )}

        {/* 회차 목록 */}
        {state.schedules && state.schedules.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {state.schedules.map((schedule) => (
              <ScheduleCard
                key={schedule.id}
                schedule={schedule}
                isSelected={state.selectedScheduleId === schedule.id}
                onClick={() => handleScheduleSelect(schedule.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* 툴팁 */}
      {state.tooltipState?.visible && (
        <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
          <div className={`
            px-4 py-2 rounded-lg shadow-lg text-sm font-medium text-white
            ${state.tooltipState.type === 'error' ? 'bg-red-600' : 
              state.tooltipState.type === 'warning' ? 'bg-yellow-600' : 
              'bg-blue-600'
            }
          `}>
            {state.tooltipState.message}
          </div>
        </div>
      )}
    </div>
  );
}
