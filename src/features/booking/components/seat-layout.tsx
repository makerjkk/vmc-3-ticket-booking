'use client';

import React from 'react';
import { SeatSelectionPage } from './seat-selection-page';

interface SeatLayoutProps {
  scheduleId: string;
  concertId: string;
}

/**
 * 좌석 배치도 컴포넌트
 * 새로운 SeatSelectionPage 컴포넌트를 래핑하여 기존 인터페이스와 호환성 유지
 */
export function SeatLayout({ scheduleId, concertId }: SeatLayoutProps) {
  return (
    <SeatSelectionPage 
      scheduleId={scheduleId}
      concertId={concertId}
    />
  );
}