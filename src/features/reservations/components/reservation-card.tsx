'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, CreditCard } from 'lucide-react';
import type { ReservationSearchItem } from '../lib/dto';
import { formatScheduleDateTime, formatSeats, formatPrice, getStatusBadgeProps } from '../lib/formatters';

type ReservationCardProps = {
  reservation: ReservationSearchItem;
};

export default function ReservationCard({ reservation }: ReservationCardProps) {
  const router = useRouter();
  const statusProps = getStatusBadgeProps(reservation.status);

  const handleCardClick = () => {
    router.push(`/reservations/${reservation.id}`);
  };

  const handleCancelClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/reservations/${reservation.id}`);
  };

  return (
    <Card 
      className="cursor-pointer hover:shadow-xl transition-all shadow-md"
      onClick={handleCardClick}
      style={{
        backgroundColor: reservation.status === 'cancelled' ? '#f8fafc' : '#ffffff',
        borderColor: '#e2e8f0'
      }}
    >
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start gap-4">
          <CardTitle 
            className="text-xl font-bold"
            style={{ color: '#1e293b' }}
          >
            {reservation.concertTitle}
          </CardTitle>
          {reservation.status === 'confirmed' ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleCancelClick}
              className="font-bold text-sm px-4 py-2 hover:opacity-90"
            >
              예약 취소하기
            </Button>
          ) : (
            <Badge 
              className={`${statusProps.bgColor} ${statusProps.textColor} font-bold text-sm px-3 py-1`}
            >
              {statusProps.text}
            </Badge>
          )}
        </div>
        <CardDescription 
          className="text-base font-semibold mt-2"
          style={{ color: '#64748b' }}
        >
          예약번호: {reservation.reservationNumber}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 pt-4">
        <div 
          className="flex items-center text-base p-3 rounded-lg"
          style={{ 
            backgroundColor: reservation.status === 'cancelled' ? '#ffffff' : '#f8fafc',
            color: '#475569'
          }}
        >
          <Calendar className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: '#3b82f6' }} />
          <span className="font-medium">{formatScheduleDateTime(reservation.scheduleDateTime)}</span>
        </div>
        <div 
          className="flex items-center text-base p-3 rounded-lg"
          style={{ 
            backgroundColor: reservation.status === 'cancelled' ? '#ffffff' : '#f8fafc',
            color: '#475569'
          }}
        >
          <MapPin className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: '#3b82f6' }} />
          <span className="font-medium">{formatSeats(reservation.seats)}</span>
        </div>
        <div 
          className="flex items-center text-lg font-bold p-3 rounded-lg"
          style={{ 
            backgroundColor: reservation.status === 'cancelled' ? '#ffffff' : '#f8fafc',
            color: '#1e293b'
          }}
        >
          <CreditCard className="w-5 h-5 mr-3 flex-shrink-0" style={{ color: '#3b82f6' }} />
          <span>{formatPrice(reservation.totalPrice)}</span>
        </div>
        {reservation.cancelledAt && (
          <div 
            className="text-sm font-medium p-3 rounded-lg"
            style={{ 
              backgroundColor: '#fef2f2',
              color: '#dc2626'
            }}
          >
            취소일: {formatScheduleDateTime(reservation.cancelledAt)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

