import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatScheduleDateTime = (dateTime: string): string => {
  if (!dateTime) {
    return '날짜 정보 없음';
  }
  
  const date = new Date(dateTime);
  
  if (isNaN(date.getTime())) {
    console.error('Invalid date value:', dateTime);
    return '잘못된 날짜 형식';
  }
  
  return format(date, 'yyyy년 MM월 dd일 HH시', { locale: ko });
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

/**
 * 취소 일시 포맷팅
 */
export const formatCancelledAt = (cancelledAt: string | null): string | null => {
  if (!cancelledAt) return null;
  
  const date = new Date(cancelledAt);
  
  if (isNaN(date.getTime())) {
    console.error('Invalid cancelled date value:', cancelledAt);
    return '잘못된 날짜 형식';
  }
  
  return format(date, 'yyyy년 MM월 dd일 HH시 mm분', { locale: ko });
};

/**
 * 좌석 요약 (다이얼로그용)
 */
export const formatSeatsSummary = (
  seats: Array<{ seatNumber?: string; grade?: string }>
): string => {
  const seatNumbers = seats.map((s) => s.seatNumber).filter(Boolean).join(', ');
  const seatCount = seats.length;
  return `${seatNumbers} (총 ${seatCount}석)`;
};

/**
 * 전화번호 자동 포맷팅
 * 01011228359 -> 010-1122-8359
 * 01012345678 -> 010-1234-5678
 */
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/[^\d]/g, '');
  
  // 전화번호가 아닌 경우 그대로 반환
  if (numbers.length === 0) {
    return '';
  }
  
  // 010으로 시작하는 경우
  if (numbers.startsWith('010')) {
    if (numbers.length <= 3) {
      return numbers;
    } else if (numbers.length <= 7) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    } else {
      // 11자리 초과 시 11자리까지만 포맷
      return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
  }
  
  // 02로 시작하는 경우 (서울)
  if (numbers.startsWith('02')) {
    if (numbers.length <= 2) {
      return numbers;
    } else if (numbers.length <= 5) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2)}`;
    } else if (numbers.length <= 10) {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    } else {
      return `${numbers.slice(0, 2)}-${numbers.slice(2, 6)}-${numbers.slice(6, 10)}`;
    }
  }
  
  // 그 외 지역번호 (031, 032 등)
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 6) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
  } else if (numbers.length <= 10) {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 6)}-${numbers.slice(6, 10)}`;
  } else {
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  }
};

