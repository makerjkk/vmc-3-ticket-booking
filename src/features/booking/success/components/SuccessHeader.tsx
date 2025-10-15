'use client';

import { CheckCircle } from 'lucide-react';

/**
 * 성공 메시지 헤더
 */
export function SuccessHeader() {
  return (
    <div 
      className="text-center mb-8 py-6"
      style={{ backgroundColor: '#ffffff' }}
    >
      <div 
        className="inline-flex items-center justify-center w-24 h-24 rounded-full mb-4 shadow-lg"
        style={{ backgroundColor: '#dcfce7' }}
      >
        <CheckCircle 
          className="w-14 h-14" 
          style={{ color: '#16a34a' }}
        />
      </div>
      <h1 
        className="text-4xl font-bold mb-3"
        style={{ color: '#1e293b' }}
      >
        예약이 완료되었습니다!
      </h1>
      <p 
        className="text-lg"
        style={{ color: '#64748b' }}
      >
        예약 내역을 확인해주세요
      </p>
    </div>
  );
}

