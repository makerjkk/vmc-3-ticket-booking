'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { ReservationDetailResponse } from '../../lib/dto';

type ReservationInfoProps = {
  reservation: ReservationDetailResponse;
  formattedData: {
    concertDateTime: string | null;
    totalPriceFormatted: string | null;
    seatNumbers: string | null;
    reservationStatusText: string | null;
    cancelledAt: string | null;
  };
};

export default function ReservationInfo({ reservation, formattedData }: ReservationInfoProps) {
  const statusBadgeVariant = reservation.status === 'confirmed' ? 'default' : 'secondary';
  const statusBgColor = reservation.status === 'confirmed' ? '#dbeafe' : '#f1f5f9';
  const statusTextColor = reservation.status === 'confirmed' ? '#1e40af' : '#64748b';

  return (
    <Card 
      className="p-8 shadow-lg border-2"
      style={{ 
        backgroundColor: '#ffffff',
        borderColor: '#e2e8f0'
      }}
    >
      <div className="flex items-center justify-between mb-8 pb-4 border-b-2" style={{ borderColor: '#e2e8f0' }}>
        <h2 
          className="text-2xl font-bold"
          style={{ color: '#0f172a' }}
        >
          예약 상세 정보
        </h2>
        <Badge 
          variant={statusBadgeVariant}
          className="text-base font-bold px-4 py-2"
          style={{
            backgroundColor: statusBgColor,
            color: statusTextColor
          }}
        >
          {formattedData.reservationStatusText}
        </Badge>
      </div>

      <div className="space-y-5">
        <InfoRow label="예약 번호" value={reservation.reservationNumber} highlight />
        <InfoRow label="콘서트" value={reservation.concert?.title || '정보 없음'} />
        <InfoRow label="공연 일시" value={formattedData.concertDateTime || '-'} />
        <InfoRow label="예약자 이름" value={reservation.customerName} />
        <InfoRow label="연락처" value={reservation.customerPhone} />
        {reservation.customerEmail && (
          <InfoRow label="이메일" value={reservation.customerEmail} />
        )}
        <InfoRow label="좌석" value={formattedData.seatNumbers || '-'} />
        <InfoRow label="총 결제 금액" value={formattedData.totalPriceFormatted || '-'} bold />
        {reservation.cancelledAt && (
          <InfoRow label="취소 일시" value={formattedData.cancelledAt || '-'} alert />
        )}
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  bold = false,
  highlight = false,
  alert = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
  highlight?: boolean;
  alert?: boolean;
}) {
  const labelColor = alert ? '#dc2626' : '#64748b';
  const valueColor = alert ? '#dc2626' : bold ? '#0f172a' : '#1e293b';
  const bgColor = highlight ? '#f8fafc' : 'transparent';
  
  return (
    <div 
      className="flex items-center py-4 px-4 rounded-lg border-b"
      style={{ 
        borderColor: '#f1f5f9',
        backgroundColor: bgColor
      }}
    >
      <span 
        className="font-semibold text-base w-40"
        style={{ color: labelColor }}
      >
        {label}
      </span>
      <span 
        className={`flex-1 text-base ${bold ? 'font-bold text-xl' : 'font-medium'}`}
        style={{ color: valueColor }}
      >
        {value}
      </span>
    </div>
  );
}

