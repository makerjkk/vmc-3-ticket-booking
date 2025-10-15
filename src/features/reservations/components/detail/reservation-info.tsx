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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">예약 상세 정보</h2>
        <Badge variant={statusBadgeVariant}>{formattedData.reservationStatusText}</Badge>
      </div>

      <div className="space-y-4">
        <InfoRow label="예약 번호" value={reservation.reservationNumber} />
        <InfoRow label="콘서트" value={reservation.concertTitle} />
        <InfoRow label="공연 일시" value={formattedData.concertDateTime || '-'} />
        <InfoRow label="예약자 이름" value={reservation.customerName} />
        <InfoRow label="연락처" value={reservation.customerPhone} />
        {reservation.customerEmail && (
          <InfoRow label="이메일" value={reservation.customerEmail} />
        )}
        <InfoRow label="좌석" value={formattedData.seatNumbers || '-'} />
        <InfoRow label="총 결제 금액" value={formattedData.totalPriceFormatted || '-'} bold />
        <InfoRow label="예약 일시" value={formattedData.concertDateTime || '-'} />
        {reservation.cancelledAt && (
          <InfoRow label="취소 일시" value={formattedData.cancelledAt || '-'} />
        )}
      </div>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  bold = false,
}: {
  label: string;
  value: string;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center border-b pb-3">
      <span className="text-gray-600 w-32">{label}</span>
      <span className={`flex-1 ${bold ? 'font-bold text-lg' : ''}`}>{value}</span>
    </div>
  );
}

