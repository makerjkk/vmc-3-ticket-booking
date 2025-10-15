'use client';

import { CheckCircle } from 'lucide-react';

/**
 * 성공 메시지 헤더
 */
export function SuccessHeader() {
  return (
    <div className="text-center mb-8">
      <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-12 h-12 text-green-600" />
      </div>
      <h1 className="text-3xl font-bold text-gray-900 mb-2">
        예약이 완료되었습니다!
      </h1>
      <p className="text-gray-600">예약 내역을 확인해주세요</p>
    </div>
  );
}

