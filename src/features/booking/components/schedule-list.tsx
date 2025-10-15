'use client';

import { useEffect, useState } from 'react';
import { useScheduleSelection } from '../context/schedule-selection-context';
import { useSchedulesByDate } from '../hooks/use-schedule-selection';
import { useAvailableDates } from '../hooks/use-available-dates';
import { ScheduleCard } from './schedule-card';
import { ScheduleLoadingSkeleton } from './schedule-loading-skeleton';
import { ScheduleErrorMessage } from './schedule-error-message';
import { SessionManager } from '../lib/session-manager';
import { DateTimeUtils } from '../lib/datetime-utils';

// 날짜 선택 컴포넌트
function DateSelector({ 
  concertId,
  selectedDate, 
  onDateSelect 
}: { 
  concertId: string;
  selectedDate: string | null; 
  onDateSelect: (date: string) => void;
}) {
  const { data: availableDates, isLoading, error } = useAvailableDates(concertId);

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">날짜 선택</h3>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 w-20 h-16 bg-gray-200 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">날짜 선택</h3>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-red-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <span className="text-sm">예매 가능한 날짜를 불러올 수 없습니다</span>
          </div>
        </div>
      </div>
    );
  }

  // 예매 가능한 날짜가 없는 경우
  if (!availableDates || availableDates.length === 0) {
    return (
      <div className="mb-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">날짜 선택</h3>
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-yellow-800">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm">현재 예매 가능한 날짜가 없습니다</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium text-gray-700 mb-3">
        날짜 선택
        <span className="ml-2 text-xs text-gray-500">
          ({availableDates.length}개 날짜 예매 가능)
        </span>
      </h3>
      <div className="flex gap-2 overflow-x-auto pb-2">
        {availableDates.map((dateInfo) => {
          const isSelected = selectedDate === dateInfo.date;
          const dayOfWeek = DateTimeUtils.getDayOfWeekKorean(dateInfo.date);
          const formattedDate = DateTimeUtils.formatDateKorean(dateInfo.date);
          const isAvailable = dateInfo.hasAvailableSeats;
          
                  return (
                    <button
                      key={dateInfo.date}
                      onClick={() => isAvailable && onDateSelect(dateInfo.date)}
                      disabled={!isAvailable}
                      className={`
                        flex-shrink-0 px-3 py-3 rounded-lg border text-sm font-medium transition-all min-w-[100px]
                        ${isSelected 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                          : isAvailable
                            ? 'bg-white text-gray-700 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                            : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                        }
                      `}
                    >
                      <div className="text-center">
                        <div className="font-medium">{dayOfWeek}</div>
                        <div className="text-xs opacity-75 mt-1">
                          {formattedDate.split(' ')[2]} {/* 일만 표시 */}
                        </div>
                        {!isAvailable && (
                          <div className="text-xs text-red-500 mt-1">매진</div>
                        )}
                        {isAvailable && dateInfo.scheduleCount > 0 && (
                          <div className="text-xs text-blue-500 mt-1">
                            {dateInfo.scheduleCount}회차
                          </div>
                        )}
                        {/* 시간 정보 표시 */}
                        {isAvailable && dateInfo.schedules && dateInfo.schedules.length > 0 && (
                          <div className="text-xs mt-1 space-y-0.5">
                            {dateInfo.schedules.slice(0, 2).map((schedule, idx) => (
                              <div 
                                key={idx}
                                className={`
                                  ${schedule.hasAvailableSeats 
                                    ? isSelected ? 'text-blue-100' : 'text-gray-600'
                                    : 'text-red-500 line-through'
                                  }
                                `}
                              >
                                {schedule.time}
                              </div>
                            ))}
                            {dateInfo.schedules.length > 2 && (
                              <div className={`${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                                +{dateInfo.schedules.length - 2}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </button>
                  );
        })}
      </div>
    </div>
  );
}

// 회차 목록 컴포넌트
export function ScheduleList({ concertId }: { concertId?: string }) {
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

  // props로 받은 concertId가 없으면 세션에서 가져오기
  const effectiveConcertId = concertId || (() => {
    const sessionData = SessionManager.load();
    return sessionData?.concertId || '';
  })();

  // React Query로 회차 데이터 페칭
  const {
    data: schedulesResponse,
    isLoading,
    error,
    refetch,
  } = useSchedulesByDate(
    effectiveConcertId,
    state.selectedDate,
    !!state.selectedDate && !!effectiveConcertId
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
        concertId={effectiveConcertId}
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
                concertId={effectiveConcertId}
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
