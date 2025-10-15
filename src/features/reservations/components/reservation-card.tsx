'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, MapPin, CreditCard } from 'lucide-react';
import type { ReservationSearchItem } from '../lib/dto';
import { formatScheduleDateTime, formatSeats, formatPrice, getStatusBadgeProps } from '../lib/formatters';

type ReservationCardProps = {
  reservation: ReservationSearchItem;
};

export default function ReservationCard({ reservation }: ReservationCardProps) {
  const router = useRouter();
  const statusProps = getStatusBadgeProps(reservation.status);

  const handleClick = () => {
    router.push(`/reservations/${reservation.id}`);
  };

  return (
    <Card 
      className={`cursor-pointer hover:shadow-lg transition-shadow ${
        reservation.status === 'cancelled' ? 'bg-gray-50' : ''
      }`}
      onClick={handleClick}
    >
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">{reservation.concertTitle}</CardTitle>
          <Badge className={`${statusProps.bgColor} ${statusProps.textColor}`}>
            {statusProps.text}
          </Badge>
        </div>
        <CardDescription>예약번호: {reservation.reservationNumber}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex items-center text-sm text-gray-600">
          <Calendar className="w-4 h-4 mr-2" />
          {formatScheduleDateTime(reservation.scheduleDateTime)}
        </div>
        <div className="flex items-center text-sm text-gray-600">
          <MapPin className="w-4 h-4 mr-2" />
          {formatSeats(reservation.seats)}
        </div>
        <div className="flex items-center text-sm font-semibold text-gray-900">
          <CreditCard className="w-4 h-4 mr-2" />
          {formatPrice(reservation.totalPrice)}
        </div>
        {reservation.cancelledAt && (
          <div className="text-xs text-gray-500 mt-2">
            취소일: {formatScheduleDateTime(reservation.cancelledAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

