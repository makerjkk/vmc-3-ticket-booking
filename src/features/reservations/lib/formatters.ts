import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatScheduleDateTime = (dateTime: string): string => {
  return format(new Date(dateTime), 'yyyy년 MM월 dd일 HH시', { locale: ko });
};

export const formatSeats = (seats: Array<{ seatNumber?: string; grade?: string; price?: number }>): string => {
  const seatNumbers = seats.map(s => s.seatNumber).filter(Boolean).join(', ');
  const seatCount = seats.length;
  return `${seatNumbers} (${seatCount}석)`;
};

export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR').format(price) + '원';
};

export const getStatusBadgeProps = (
  status: 'confirmed' | 'cancelled'
): { text: string; bgColor: string; textColor: string } => {
  if (status === 'confirmed') {
    return {
      text: '확정',
      bgColor: 'bg-blue-100',
      textColor: 'text-blue-800',
    };
  }
  return {
    text: '취소됨',
    bgColor: 'bg-gray-100',
    textColor: 'text-gray-600',
  };
};

