import { format, parseISO, isAfter, isBefore, differenceInMinutes, differenceInHours } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜/시간 처리 유틸리티
 */
export class DateTimeUtils {
  /**
   * 회차 시간을 HH:MM 형식으로 포맷
   */
  static formatScheduleTime(dateTimeString: string): string {
    try {
      const date = parseISO(dateTimeString);
      return format(date, 'HH:mm');
    } catch (error) {
      console.error('Invalid date format:', dateTimeString);
      return '00:00';
    }
  }

  /**
   * 날짜를 YYYY-MM-DD 형식으로 포맷
   */
  static formatDate(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'yyyy-MM-dd');
    } catch (error) {
      console.error('Invalid date:', date);
      return '';
    }
  }

  /**
   * 날짜를 한국어 형식으로 포맷 (예: 2024년 12월 25일)
   */
  static formatDateKorean(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'yyyy년 MM월 dd일', { locale: ko });
    } catch (error) {
      console.error('Invalid date:', date);
      return '';
    }
  }

  /**
   * 날짜와 시간을 한국어 형식으로 포맷 (예: 2024년 12월 25일 19:00)
   */
  static formatDateTimeKorean(dateTimeString: string): string {
    try {
      const date = parseISO(dateTimeString);
      return format(date, 'yyyy년 MM월 dd일 HH:mm', { locale: ko });
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return '';
    }
  }

  /**
   * 요일을 한국어로 반환 (예: 월, 화, 수)
   */
  static getDayOfWeekKorean(date: Date | string): string {
    try {
      const dateObj = typeof date === 'string' ? parseISO(date) : date;
      return format(dateObj, 'E', { locale: ko });
    } catch (error) {
      console.error('Invalid date:', date);
      return '';
    }
  }

  /**
   * 과거 날짜인지 확인
   */
  static isPastDate(dateString: string): boolean {
    try {
      const date = parseISO(dateString);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return isBefore(date, today);
    } catch (error) {
      console.error('Invalid date:', dateString);
      return true; // 에러 시 안전하게 과거로 처리
    }
  }

  /**
   * 미래 날짜인지 확인
   */
  static isFutureDate(dateString: string): boolean {
    try {
      const date = parseISO(dateString);
      const now = new Date();
      return isAfter(date, now);
    } catch (error) {
      console.error('Invalid date:', dateString);
      return false;
    }
  }

  /**
   * 회차 시간이 과거인지 확인
   */
  static isPastSchedule(dateTimeString: string): boolean {
    try {
      const scheduleTime = parseISO(dateTimeString);
      const now = new Date();
      return isBefore(scheduleTime, now);
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return true;
    }
  }

  /**
   * 회차 시작까지 남은 시간 (분)
   */
  static getMinutesUntilSchedule(dateTimeString: string): number {
    try {
      const scheduleTime = parseISO(dateTimeString);
      const now = new Date();
      return Math.max(0, differenceInMinutes(scheduleTime, now));
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return 0;
    }
  }

  /**
   * 회차 시작까지 남은 시간 (시간)
   */
  static getHoursUntilSchedule(dateTimeString: string): number {
    try {
      const scheduleTime = parseISO(dateTimeString);
      const now = new Date();
      return Math.max(0, differenceInHours(scheduleTime, now));
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return 0;
    }
  }

  /**
   * 상대 시간 표시 (예: 2시간 후, 30분 후)
   */
  static getRelativeTime(dateTimeString: string): string {
    try {
      const scheduleTime = parseISO(dateTimeString);
      const now = new Date();
      
      if (isBefore(scheduleTime, now)) {
        return '시간 지남';
      }

      const hoursUntil = differenceInHours(scheduleTime, now);
      const minutesUntil = differenceInMinutes(scheduleTime, now);

      if (hoursUntil >= 24) {
        const days = Math.floor(hoursUntil / 24);
        return `${days}일 후`;
      } else if (hoursUntil >= 1) {
        return `${hoursUntil}시간 후`;
      } else if (minutesUntil >= 1) {
        return `${minutesUntil}분 후`;
      } else {
        return '곧 시작';
      }
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return '';
    }
  }

  /**
   * 예매 마감 시간 확인 (공연 2시간 전까지)
   */
  static isBookingDeadlinePassed(dateTimeString: string): boolean {
    try {
      const scheduleTime = parseISO(dateTimeString);
      const now = new Date();
      const deadlineTime = new Date(scheduleTime.getTime() - (2 * 60 * 60 * 1000)); // 2시간 전
      
      return isAfter(now, deadlineTime);
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return true;
    }
  }

  /**
   * 취소 가능 시간 확인 (공연 2시간 전까지)
   */
  static isCancellationAllowed(dateTimeString: string): boolean {
    return !this.isBookingDeadlinePassed(dateTimeString);
  }

  /**
   * 현재 시간을 ISO 문자열로 반환
   */
  static getCurrentISOString(): string {
    return new Date().toISOString();
  }

  /**
   * KST 타임존으로 변환
   */
  static toKST(dateTimeString: string): Date {
    try {
      const date = parseISO(dateTimeString);
      // KST는 UTC+9
      const kstOffset = 9 * 60 * 60 * 1000;
      return new Date(date.getTime() + kstOffset);
    } catch (error) {
      console.error('Invalid datetime:', dateTimeString);
      return new Date();
    }
  }

  /**
   * 날짜 문자열 유효성 검증
   */
  static isValidDateString(dateString: string): boolean {
    try {
      const date = parseISO(dateString);
      return !isNaN(date.getTime());
    } catch {
      return false;
    }
  }

  /**
   * YYYY-MM-DD 형식 검증
   */
  static isValidDateFormat(dateString: string): boolean {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dateRegex.test(dateString) && this.isValidDateString(dateString);
  }

  /**
   * 오늘 날짜를 YYYY-MM-DD 형식으로 반환
   */
  static getTodayString(): string {
    return this.formatDate(new Date());
  }

  /**
   * 내일 날짜를 YYYY-MM-DD 형식으로 반환
   */
  static getTomorrowString(): string {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.formatDate(tomorrow);
  }

  /**
   * N일 후 날짜를 YYYY-MM-DD 형식으로 반환
   */
  static getDateAfterDays(days: number): string {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);
    return this.formatDate(futureDate);
  }

  /**
   * 두 날짜 사이의 일수 계산
   */
  static getDaysBetween(startDate: string, endDate: string): number {
    try {
      const start = parseISO(startDate);
      const end = parseISO(endDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      console.error('Invalid date range:', startDate, endDate);
      return 0;
    }
  }
}
