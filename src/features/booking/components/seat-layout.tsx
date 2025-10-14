'use client';

import { useEffect, useState } from 'react';
import { useScheduleSelection } from '../context/schedule-selection-context';
import { useSeatLayout } from '../hooks/use-schedule-selection';
import { SeatGrid } from './seat-grid';
import { SessionManager } from '../lib/session-manager';
import type { SeatLayoutResponse } from '../lib/dto';

// 좌석 범례 컴포넌트
function SeatLegend() {
  const legendItems = [
    { color: 'bg-gray-100 border-gray-300', label: '선택 가능', textColor: 'text-gray-700' },
    { color: 'bg-blue-600 border-blue-600', label: '선택됨', textColor: 'text-white' },
    { color: 'bg-gray-400 border-gray-400', label: '매진', textColor: 'text-white' },
  ];

  return (
    <div className="flex flex-wrap gap-4 justify-center mb-6">
      {legendItems.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <div className={`w-4 h-4 rounded border-2 ${item.color} ${item.textColor}`} />
          <span className="text-sm text-gray-600">{item.label}</span>
        </div>
      ))}
    </div>
  );
}

// 등급별 가격 정보 컴포넌트
function GradeInfo({ gradeInfo }: { gradeInfo: SeatLayoutResponse['gradeInfo'] }) {
  if (!gradeInfo || gradeInfo.length === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <h4 className="text-sm font-medium text-gray-700 mb-3">등급별 정보</h4>
      <div className="space-y-2">
        {gradeInfo.map((grade) => (
          <div key={grade.grade} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div 
                className="w-4 h-4 rounded"
                style={{ backgroundColor: grade.color }}
              />
              <span className="font-medium text-gray-900">{grade.grade}석</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium text-gray-900">
                {grade.price.toLocaleString()}원
              </div>
              <div className="text-xs text-gray-500">
                잔여 {grade.availableSeats}/{grade.totalSeats}석
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// 선택된 좌석 정보 컴포넌트
function SelectedSeatsInfo() {
  const { selectedSeatsInfo, state } = useScheduleSelection();

  if (selectedSeatsInfo.length === 0) {
    return (
      <div className="text-center py-6 text-gray-500">
        <svg className="w-8 h-8 mx-auto mb-2 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">좌석을 선택해주세요</p>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-medium text-gray-700 mb-3">
        선택된 좌석 ({selectedSeatsInfo.length}석)
      </h4>
      <div className="space-y-2 mb-4">
        {selectedSeatsInfo.map((seat) => (
          <div key={seat.seatId} className="flex items-center justify-between p-2 bg-blue-50 rounded">
            <span className="text-sm font-medium text-blue-900">
              {seat.grade}석 {seat.seatNumber}
            </span>
            <span className="text-sm text-blue-700">
              {seat.price.toLocaleString()}원
            </span>
          </div>
        ))}
      </div>
      
      <div className="border-t pt-4">
        <div className="flex items-center justify-between">
          <span className="text-base font-semibold text-gray-900">총 결제 금액</span>
          <span className="text-lg font-bold text-blue-600">
            {state.totalPrice.toLocaleString()}원
          </span>
        </div>
      </div>

      {/* 다음 단계 버튼 */}
      {selectedSeatsInfo.length > 0 && (
        <button
          className="w-full mt-4 bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          onClick={() => {
            // 실제로는 결제 페이지로 이동
            alert('결제 페이지로 이동합니다.');
          }}
        >
          결제하기
        </button>
      )}
    </div>
  );
}

// 메인 좌석 배치도 컴포넌트
export function SeatLayout() {
  const {
    state,
    loadSeatsStart,
    loadSeatsSuccess,
    loadSeatsFailure,
  } = useScheduleSelection();

  // React Query로 좌석 데이터 페칭
  const {
    data: seatLayoutResponse,
    isLoading,
    error,
    refetch,
  } = useSeatLayout(
    state.selectedScheduleId,
    !!state.selectedScheduleId
  );

  // 로딩 상태 동기화
  useEffect(() => {
    if (isLoading) {
      loadSeatsStart();
    } else if (seatLayoutResponse) {
      loadSeatsSuccess(seatLayoutResponse.seats);
    } else if (error) {
      loadSeatsFailure(error as Error);
    }
  }, [isLoading, seatLayoutResponse, error, loadSeatsStart, loadSeatsSuccess, loadSeatsFailure]);

  // 회차 미선택 상태
  if (!state.selectedScheduleId) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm">먼저 회차를 선택해주세요</p>
      </div>
    );
  }

  // 로딩 상태
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-8 gap-2">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className="h-8 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="text-center py-12">
        <svg className="w-12 h-12 mx-auto mb-4 text-red-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
        <p className="text-sm text-red-600 mb-4">좌석 정보를 불러올 수 없습니다</p>
        <button
          onClick={() => refetch()}
          className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  // 좌석 데이터 없음
  if (!seatLayoutResponse || !seatLayoutResponse.seats || seatLayoutResponse.seats.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-sm">좌석 정보가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 무대 표시 */}
      <div className="text-center">
        <div className="inline-block px-8 py-2 bg-gray-800 text-white text-sm font-medium rounded-t-lg">
          STAGE
        </div>
      </div>

      {/* 좌석 범례 */}
      <SeatLegend />

      {/* 등급별 정보 */}
      <GradeInfo gradeInfo={seatLayoutResponse.gradeInfo} />

      {/* 좌석 그리드 */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <SeatGrid 
          seats={seatLayoutResponse.seats}
          selectedSeats={state.selectedSeats}
        />
      </div>

      {/* 선택된 좌석 정보 */}
      <div className="border-t pt-6">
        <SelectedSeatsInfo />
      </div>
    </div>
  );
}
