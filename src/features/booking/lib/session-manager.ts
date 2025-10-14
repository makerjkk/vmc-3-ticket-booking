import type { SessionData } from './dto';

// 세션 키 상수
const SESSION_KEY = 'booking_session';
const SESSION_EXPIRY_MINUTES = 30;

/**
 * 세션 스토리지 관리 유틸리티
 */
export class SessionManager {
  private static isSupported(): boolean {
    try {
      return typeof window !== 'undefined' && 'sessionStorage' in window;
    } catch {
      return false;
    }
  }

  /**
   * 세션 데이터 저장
   */
  static save(data: Partial<SessionData>): boolean {
    if (!this.isSupported()) {
      console.warn('SessionStorage is not supported');
      return false;
    }

    try {
      const now = Date.now();
      const expiresAt = now + (SESSION_EXPIRY_MINUTES * 60 * 1000);
      
      const existingData = this.load();
      const sessionData: SessionData = {
        concertId: existingData?.concertId || '',
        selectedDate: null,
        selectedScheduleId: null,
        selectedSeats: [],
        timestamp: now,
        expiresAt,
        ...data,
      };

      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
      return true;
    } catch (error) {
      console.error('Failed to save session data:', error);
      return false;
    }
  }

  /**
   * 세션 데이터 로드
   */
  static load(): SessionData | null {
    if (!this.isSupported()) {
      return null;
    }

    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (!stored) {
        return null;
      }

      const data: SessionData = JSON.parse(stored);
      
      // 만료 시간 확인
      if (Date.now() > data.expiresAt) {
        this.clear();
        return null;
      }

      return data;
    } catch (error) {
      console.error('Failed to load session data:', error);
      this.clear(); // 손상된 데이터 정리
      return null;
    }
  }

  /**
   * 특정 필드 업데이트
   */
  static update(updates: Partial<SessionData>): boolean {
    const existingData = this.load();
    if (!existingData) {
      return this.save(updates);
    }

    return this.save({
      ...existingData,
      ...updates,
      timestamp: Date.now(),
    });
  }

  /**
   * 세션 데이터 삭제
   */
  static clear(): void {
    if (!this.isSupported()) {
      return;
    }

    try {
      sessionStorage.removeItem(SESSION_KEY);
    } catch (error) {
      console.error('Failed to clear session data:', error);
    }
  }

  /**
   * 세션 유효성 확인
   */
  static isValid(): boolean {
    const data = this.load();
    return data !== null && Date.now() <= data.expiresAt;
  }

  /**
   * 세션 만료까지 남은 시간 (밀리초)
   */
  static getTimeUntilExpiry(): number {
    const data = this.load();
    if (!data) {
      return 0;
    }

    return Math.max(0, data.expiresAt - Date.now());
  }

  /**
   * 세션 연장
   */
  static extend(): boolean {
    const data = this.load();
    if (!data) {
      return false;
    }

    const now = Date.now();
    const expiresAt = now + (SESSION_EXPIRY_MINUTES * 60 * 1000);

    return this.update({
      timestamp: now,
      expiresAt,
    });
  }

  /**
   * 선택된 날짜 저장
   */
  static saveSelectedDate(concertId: string, date: string): boolean {
    return this.update({
      concertId,
      selectedDate: date,
      selectedScheduleId: null, // 날짜 변경 시 회차 초기화
      selectedSeats: [], // 날짜 변경 시 좌석 초기화
    });
  }

  /**
   * 선택된 회차 저장
   */
  static saveSelectedSchedule(scheduleId: string): boolean {
    return this.update({
      selectedScheduleId: scheduleId,
      selectedSeats: [], // 회차 변경 시 좌석 초기화
    });
  }

  /**
   * 선택된 좌석 저장
   */
  static saveSelectedSeats(seatIds: string[]): boolean {
    return this.update({
      selectedSeats: seatIds,
    });
  }

  /**
   * 좌석 추가
   */
  static addSeat(seatId: string): boolean {
    const data = this.load();
    if (!data) {
      return false;
    }

    const selectedSeats = data.selectedSeats || [];
    if (selectedSeats.includes(seatId)) {
      return true; // 이미 선택된 좌석
    }

    // 최대 4석 제한
    if (selectedSeats.length >= 4) {
      return false;
    }

    return this.saveSelectedSeats([...selectedSeats, seatId]);
  }

  /**
   * 좌석 제거
   */
  static removeSeat(seatId: string): boolean {
    const data = this.load();
    if (!data) {
      return false;
    }

    const selectedSeats = data.selectedSeats || [];
    const updatedSeats = selectedSeats.filter(id => id !== seatId);
    
    return this.saveSelectedSeats(updatedSeats);
  }

  /**
   * 모든 좌석 선택 해제
   */
  static clearSelectedSeats(): boolean {
    return this.update({
      selectedSeats: [],
    });
  }

  /**
   * 디버그 정보 출력
   */
  static debug(): void {
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    const data = this.load();
    const timeUntilExpiry = this.getTimeUntilExpiry();
    
    console.group('Session Manager Debug');
    console.log('Session Data:', data);
    console.log('Is Valid:', this.isValid());
    console.log('Time Until Expiry (ms):', timeUntilExpiry);
    console.log('Time Until Expiry (min):', Math.round(timeUntilExpiry / 1000 / 60));
    console.groupEnd();
  }
}
