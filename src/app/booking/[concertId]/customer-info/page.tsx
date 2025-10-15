'use client';

import React from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { CustomerInfoPage } from '@/features/booking/components/customer-info-page';

export default function CustomerInfo() {
  const params = useParams();
  const searchParams = useSearchParams();
  
  const concertId = params.concertId as string;
  const scheduleId = searchParams.get('scheduleId');
  const seats = searchParams.get('seats');

  // 필수 파라미터 검증
  if (!scheduleId || !seats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">잘못된 접근입니다</h1>
          <p className="text-gray-600 mb-6">
            좌석 선택 페이지에서 다시 시작해주세요.
          </p>
          <a 
            href={`/booking/${concertId}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            예매 페이지로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  // 좌석 ID 배열로 변환
  const seatIds = seats.split(',').filter(Boolean);

  if (seatIds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">선택된 좌석이 없습니다</h1>
          <p className="text-gray-600 mb-6">
            좌석을 선택한 후 다시 시도해주세요.
          </p>
          <a 
            href={`/booking/${concertId}/seats?scheduleId=${scheduleId}`}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            좌석 선택으로 돌아가기
          </a>
        </div>
      </div>
    );
  }

  return (
    <CustomerInfoPage 
      concertId={concertId}
      scheduleId={scheduleId}
      seatIds={seatIds}
    />
  );
}
