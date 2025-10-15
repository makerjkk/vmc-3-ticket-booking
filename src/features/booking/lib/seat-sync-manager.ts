import { NetworkAwarePollingManager } from './polling-manager';
import { SessionManager } from './session-manager';
import type { Seat, PollingConfig } from './dto';

/**
 * 실시간 좌석 상태 동기화 관리자
 */
export class SeatSyncManager {
  private pollingManager: NetworkAwarePollingManager;
  private scheduleId: string;
  private onUpdate: (seats: Seat[]) => void;
  private onConflict: (conflictSeats: string[]) => void;
  private onError?: (error: Error) => void;
  private lastKnownSeats: Map<string, Seat> = new Map();
  private isDestroyed = false;

  constructor(
    scheduleId: string,
    options: {
      onUpdate: (seats: Seat[]) => void;
      onConflict: (conflictSeats: string[]) => void;
      onError?: (error: Error) => void;
      interval?: number;
      maxRetries?: number;
    }
  ) {
    this.scheduleId = scheduleId;
    this.onUpdate = options.onUpdate;
    this.onConflict = options.onConflict;
    this.onError = options.onError;

    const config: Partial<PollingConfig> = {
      interval: options.interval || 3000, // 3초
      maxRetries: options.maxRetries || 3,
      backoffMultiplier: 2,
      enabled: true,
    };

    this.pollingManager = new NetworkAwarePollingManager(
      this.syncSeats.bind(this),
      config,
      {
        onError: this.handleSyncError.bind(this),
        onSuccess: this.handleSyncSuccess.bind(this),
        onNetworkChange: this.handleNetworkChange.bind(this),
      }
    );
  }

  /**
   * 좌석 상태 동기화 실행
   */
  private async syncSeats(): Promise<void> {
    if (this.isDestroyed) {
      return;
    }

    try {
      const response = await this.fetchSeatStatus();
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      
      // 백엔드 respond 함수는 성공 시 result.data를 직접 반환
      // data는 SeatStatusUpdate 형태: { scheduleId, seats, timestamp }
      if (!data || !Array.isArray(data.seats)) {
        throw new Error('Invalid response format');
      }

      const updatedSeats: Seat[] = data.seats;
      
      // 충돌 감지
      const conflicts = this.detectConflicts(updatedSeats);
      if (conflicts.length > 0) {
        this.onConflict(conflicts);
      }

      // 변화 감지 및 업데이트
      if (this.hasSeatsChanged(updatedSeats)) {
        this.updateLastKnownSeats(updatedSeats);
        this.onUpdate(updatedSeats);
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown sync error';
      throw new Error(`Seat sync failed: ${errorMessage}`);
    }
  }

  /**
   * 좌석 상태 API 호출
   */
  private async fetchSeatStatus(): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5초 타임아웃

    try {
      const response = await fetch(`/api/schedules/${this.scheduleId}/seats/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  /**
   * 충돌 감지
   */
  private detectConflicts(serverSeats: Seat[]): string[] {
    const sessionData = SessionManager.load();
    const localSelectedSeats = sessionData?.selectedSeats || [];
    const conflicts: string[] = [];

    for (const seatId of localSelectedSeats) {
      const serverSeat = serverSeats.find(s => s.id === seatId);
      
      // 서버에서 해당 좌석이 예약됨 또는 다른 사용자가 홀드 중인 경우
      if (serverSeat && (serverSeat.status === 'reserved' || serverSeat.status === 'held')) {
        conflicts.push(seatId);
      }
    }

    return conflicts;
  }

  /**
   * 좌석 변화 감지
   */
  private hasSeatsChanged(newSeats: Seat[]): boolean {
    if (this.lastKnownSeats.size === 0) {
      return true; // 첫 번째 로드
    }

    // 좌석 수가 다른 경우
    if (newSeats.length !== this.lastKnownSeats.size) {
      return true;
    }

    // 각 좌석의 상태 비교
    for (const seat of newSeats) {
      const lastKnownSeat = this.lastKnownSeats.get(seat.id);
      
      if (!lastKnownSeat || lastKnownSeat.status !== seat.status) {
        return true;
      }
    }

    return false;
  }

  /**
   * 마지막 알려진 좌석 상태 업데이트
   */
  private updateLastKnownSeats(seats: Seat[]): void {
    this.lastKnownSeats.clear();
    
    seats.forEach(seat => {
      this.lastKnownSeats.set(seat.id, { ...seat });
    });
  }

  /**
   * 동기화 성공 핸들러
   */
  private handleSyncSuccess(): void {
    // 성공 로그 (개발 모드에서만)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SeatSync] Successfully synced seats for schedule ${this.scheduleId}`);
    }
  }

  /**
   * 동기화 에러 핸들러
   */
  private handleSyncError(error: Error, retryCount: number): void {
    console.error(`[SeatSync] Sync error (attempt ${retryCount}):`, error);
    
    // 에러 콜백 호출
    this.onError?.(error);

    // 최대 재시도 횟수 도달 시
    if (retryCount >= (this.pollingManager.getStatus().config.maxRetries || 3)) {
      console.error('[SeatSync] Max retry count reached, stopping sync');
    }
  }

  /**
   * 네트워크 상태 변화 핸들러
   */
  private handleNetworkChange(isOnline: boolean): void {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SeatSync] Network status changed: ${isOnline ? 'online' : 'offline'}`);
    }

    if (isOnline) {
      // 온라인 복구 시 즉시 동기화 실행
      this.forceSync().catch(error => {
        console.error('[SeatSync] Force sync after network recovery failed:', error);
      });
    }
  }

  /**
   * 동기화 시작
   */
  start(): void {
    if (this.isDestroyed) {
      console.warn('[SeatSync] Cannot start destroyed SeatSyncManager');
      return;
    }

    this.pollingManager.start();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SeatSync] Started syncing for schedule ${this.scheduleId}`);
    }
  }

  /**
   * 동기화 중지
   */
  stop(): void {
    this.pollingManager.stop();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SeatSync] Stopped syncing for schedule ${this.scheduleId}`);
    }
  }

  /**
   * 강제 동기화 (Promise 반환하지만 async/await 사용하지 않음)
   */
  forceSync(): Promise<void> {
    if (this.isDestroyed) {
      return Promise.reject(new Error('Cannot force sync on destroyed SeatSyncManager'));
    }

    return this.syncSeats().catch(error => {
      const errorMessage = error instanceof Error ? error.message : 'Force sync failed';
      throw new Error(errorMessage);
    });
  }

  /**
   * 설정 업데이트
   */
  updateConfig(config: Partial<PollingConfig>): void {
    this.pollingManager.updateConfig(config);
  }

  /**
   * 현재 상태 조회
   */
  getStatus() {
    return {
      ...this.pollingManager.getStatus(),
      scheduleId: this.scheduleId,
      lastKnownSeatsCount: this.lastKnownSeats.size,
      isDestroyed: this.isDestroyed,
    };
  }

  /**
   * 네트워크 상태 확인
   */
  isOnline(): boolean {
    return this.pollingManager.isOnline();
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    if (this.isDestroyed) {
      return;
    }

    this.isDestroyed = true;
    this.pollingManager.destroy();
    this.lastKnownSeats.clear();
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[SeatSync] Destroyed SeatSyncManager for schedule ${this.scheduleId}`);
    }
  }
}

/**
 * SeatSyncManager 팩토리 함수
 */
export const createSeatSyncManager = (
  scheduleId: string,
  options: {
    onUpdate: (seats: Seat[]) => void;
    onConflict: (conflictSeats: string[]) => void;
    onError?: (error: Error) => void;
    interval?: number;
    maxRetries?: number;
  }
): SeatSyncManager => {
  return new SeatSyncManager(scheduleId, options);
};

/**
 * 여러 스케줄에 대한 동기화 관리자
 */
export class MultiScheduleSyncManager {
  private syncManagers: Map<string, SeatSyncManager> = new Map();
  private globalOnError?: (error: Error, scheduleId: string) => void;

  constructor(options?: {
    onError?: (error: Error, scheduleId: string) => void;
  }) {
    this.globalOnError = options?.onError;
  }

  /**
   * 스케줄 동기화 추가
   */
  addSchedule(
    scheduleId: string,
    options: {
      onUpdate: (seats: Seat[]) => void;
      onConflict: (conflictSeats: string[]) => void;
      onError?: (error: Error) => void;
      interval?: number;
      maxRetries?: number;
    }
  ): void {
    // 기존 매니저가 있으면 정리
    this.removeSchedule(scheduleId);

    const syncManager = new SeatSyncManager(scheduleId, {
      ...options,
      onError: (error) => {
        options.onError?.(error);
        this.globalOnError?.(error, scheduleId);
      },
    });

    this.syncManagers.set(scheduleId, syncManager);
    syncManager.start();
  }

  /**
   * 스케줄 동기화 제거
   */
  removeSchedule(scheduleId: string): void {
    const syncManager = this.syncManagers.get(scheduleId);
    
    if (syncManager) {
      syncManager.destroy();
      this.syncManagers.delete(scheduleId);
    }
  }

  /**
   * 특정 스케줄 강제 동기화
   */
  forceSync(scheduleId: string): Promise<void> {
    const syncManager = this.syncManagers.get(scheduleId);
    
    if (!syncManager) {
      return Promise.reject(new Error(`No sync manager found for schedule ${scheduleId}`));
    }

    return syncManager.forceSync();
  }

  /**
   * 모든 스케줄 강제 동기화
   */
  forceSyncAll(): Promise<void> {
    const promises = Array.from(this.syncManagers.values()).map(manager => 
      manager.forceSync().catch(error => {
        console.error('Force sync failed for manager:', error);
        return error;
      })
    );

    return Promise.allSettled(promises).then(() => undefined);
  }

  /**
   * 모든 동기화 중지
   */
  stopAll(): void {
    this.syncManagers.forEach(manager => manager.stop());
  }

  /**
   * 모든 동기화 시작
   */
  startAll(): void {
    this.syncManagers.forEach(manager => manager.start());
  }

  /**
   * 전체 상태 조회
   */
  getStatus() {
    const statuses: Record<string, any> = {};
    
    this.syncManagers.forEach((manager, scheduleId) => {
      statuses[scheduleId] = manager.getStatus();
    });

    return {
      totalManagers: this.syncManagers.size,
      schedules: statuses,
    };
  }

  /**
   * 모든 리소스 정리
   */
  destroy(): void {
    this.syncManagers.forEach(manager => manager.destroy());
    this.syncManagers.clear();
  }
}
