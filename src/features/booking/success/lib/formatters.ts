import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜 포맷팅 (yyyy년 MM월 dd일 (E) HH:mm)
 */
export function formatScheduleDateTime(dateTime: string): string {
  const date = new Date(dateTime);
  return format(date, 'yyyy년 MM월 dd일 (E) HH:mm', { locale: ko });
}

/**
 * 가격 포맷팅 (₩150,000)
 */
export function formatPrice(price: number): string {
  return `₩${price.toLocaleString('ko-KR')}`;
}

/**
 * 좌석 등급별 그룹화
 */
export function groupSeatsByGrade(
  seats: Array<{ seatNumber: string; grade: string; price: number }>
): Record<string, Array<{ seatNumber: string; grade: string; price: number }>> {
  return seats.reduce((acc, seat) => {
    if (!acc[seat.grade]) {
      acc[seat.grade] = [];
    }
    acc[seat.grade].push(seat);
    return acc;
  }, {} as Record<string, Array<{ seatNumber: string; grade: string; price: number }>>);
}

