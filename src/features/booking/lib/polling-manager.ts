import type { PollingConfig } from './dto';

/**
 * 실시간 폴링 관리 유틸리티
 */
export class PollingManager {
  private intervalId: NodeJS.Timeout | null = null;
  private retryCount = 0;
  private isActive = false;
  private config: PollingConfig;
  private callback: () => Promise<void>;
  private onError?: (error: Error, retryCount: number) => void;
  private onSuccess?: () => void;

  constructor(
    callback: () => Promise<void>,
    config: Partial<PollingConfig> = {},
    options: {
      onError?: (error: Error, retryCount: number) => void;
      onSuccess?: () => void;
    } = {}
  ) {
    this.callback = callback;
    this.onError = options.onError;
    this.onSuccess = options.onSuccess;
    
    // 기본 설정
    this.config = {
      interval: 5000, // 5초
      maxRetries: 3,
      backoffMultiplier: 2,
      enabled: true,
      ...config,
    };
  }

  /**
   * 폴링 시작
   */
  start(): void {
    if (this.intervalId || !this.config.enabled) {
      return;
    }

    this.isActive = true;
    this.retryCount = 0;
    
    // 즉시 한 번 실행
    this.executeCallback();
    
    // 주기적 실행 설정
    this.intervalId = setInterval(() => {
      this.executeCallback();
    }, this.config.interval);

    console.log(`Polling started with ${this.config.interval}ms interval`);
  }

  /**
   * 폴링 중지
   */
  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    
    this.isActive = false;
    this.retryCount = 0;
    
    console.log('Polling stopped');
  }

  /**
   * 폴링 재시작
   */
  restart(): void {
    this.stop();
    this.start();
  }

  /**
   * 설정 업데이트
   */
  updateConfig(newConfig: Partial<PollingConfig>): void {
    const wasActive = this.isActive;
    
    if (wasActive) {
      this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasActive && this.config.enabled) {
      this.start();
    }
  }

  /**
   * 현재 상태 확인
   */
  getStatus() {
    return {
      isActive: this.isActive,
      retryCount: this.retryCount,
      config: { ...this.config },
      intervalId: this.intervalId,
    };
  }

  /**
   * 콜백 실행 및 에러 처리
   */
  protected async executeCallback(): Promise<void> {
    try {
      await this.callback();
      
      // 성공 시 재시도 카운트 리셋
      if (this.retryCount > 0) {
        this.retryCount = 0;
        console.log('Polling recovered from errors');
      }
      
      this.onSuccess?.();
    } catch (error) {
      this.retryCount++;
      const err = error instanceof Error ? error : new Error('Unknown polling error');
      
      console.error(`Polling error (attempt ${this.retryCount}/${this.config.maxRetries}):`, err);
      
      this.onError?.(err, this.retryCount);
      
      // 최대 재시도 횟수 초과 시 폴링 중지
      if (this.retryCount >= this.config.maxRetries) {
        console.error('Max retry count reached, stopping polling');
        this.stop();
        return;
      }
      
      // 지수 백오프 적용
      const backoffDelay = this.config.interval * Math.pow(this.config.backoffMultiplier, this.retryCount - 1);
      
      console.log(`Retrying in ${backoffDelay}ms...`);
      
      // 현재 인터벌 중지하고 백오프 적용
      if (this.intervalId) {
        clearInterval(this.intervalId);
        
        setTimeout(() => {
          if (this.isActive) {
            // 백오프 후 정상 인터벌로 재시작
            this.intervalId = setInterval(() => {
              this.executeCallback();
            }, this.config.interval);
          }
        }, backoffDelay);
      }
    }
  }

  /**
   * 리소스 정리
   */
  destroy(): void {
    this.stop();
    this.callback = async () => {};
    this.onError = undefined;
    this.onSuccess = undefined;
  }
}

/**
 * 페이지 가시성 기반 폴링 관리자
 */
export class VisibilityAwarePollingManager extends PollingManager {
  private visibilityChangeHandler: () => void;

  constructor(
    callback: () => Promise<void>,
    config: Partial<PollingConfig> = {},
    options: {
      onError?: (error: Error, retryCount: number) => void;
      onSuccess?: () => void;
    } = {}
  ) {
    super(callback, config, options);

    // 페이지 가시성 변경 이벤트 핸들러
    this.visibilityChangeHandler = () => {
      if (document.hidden) {
        console.log('Page hidden, pausing polling');
        this.pause();
      } else {
        console.log('Page visible, resuming polling');
        this.resume();
      }
    };

    // 이벤트 리스너 등록
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.visibilityChangeHandler);
    }
  }

  /**
   * 폴링 일시 중지 (인터벌은 유지하되 콜백 실행 안함)
   */
  private pause(): void {
    // 실제 구현에서는 콜백 실행을 건너뛰는 플래그 사용
    this.updateConfig({ enabled: false });
  }

  /**
   * 폴링 재개
   */
  private resume(): void {
    this.updateConfig({ enabled: true });
    
    // 페이지가 다시 보일 때 즉시 한 번 실행
    if (this.getStatus().isActive) {
      this.executeCallback();
    }
  }

  /**
   * 리소스 정리 (부모 클래스 메서드 오버라이드)
   */
  destroy(): void {
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityChangeHandler);
    }
    
    super.destroy();
  }

}

/**
 * 네트워크 상태 인식 폴링 관리자
 */
export class NetworkAwarePollingManager extends VisibilityAwarePollingManager {
  private onlineHandler: () => void;
  private offlineHandler: () => void;

  constructor(
    callback: () => Promise<void>,
    config: Partial<PollingConfig> = {},
    options: {
      onError?: (error: Error, retryCount: number) => void;
      onSuccess?: () => void;
      onNetworkChange?: (isOnline: boolean) => void;
    } = {}
  ) {
    super(callback, config, options);

    const { onNetworkChange } = options;

    // 네트워크 상태 변경 핸들러
    this.onlineHandler = () => {
      console.log('Network online, resuming polling');
      this.updateConfig({ enabled: true });
      onNetworkChange?.(true);
      
      // 온라인 복구 시 즉시 실행
      if (this.getStatus().isActive) {
        this.executeCallback();
      }
    };

    this.offlineHandler = () => {
      console.log('Network offline, pausing polling');
      this.updateConfig({ enabled: false });
      onNetworkChange?.(false);
    };

    // 이벤트 리스너 등록
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.onlineHandler);
      window.addEventListener('offline', this.offlineHandler);
      
      // 초기 네트워크 상태 확인
      if (!navigator.onLine) {
        this.updateConfig({ enabled: false });
      }
    }
  }

  /**
   * 현재 네트워크 상태 확인
   */
  isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
  }

  /**
   * 리소스 정리 (부모 클래스 메서드 오버라이드)
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.onlineHandler);
      window.removeEventListener('offline', this.offlineHandler);
    }
    
    super.destroy();
  }
}

/**
 * 폴링 관리자 팩토리 함수
 */
export const createPollingManager = (
  callback: () => Promise<void>,
  config: Partial<PollingConfig> = {},
  options: {
    onError?: (error: Error, retryCount: number) => void;
    onSuccess?: () => void;
    onNetworkChange?: (isOnline: boolean) => void;
    enableVisibilityAware?: boolean;
    enableNetworkAware?: boolean;
  } = {}
) => {
  const {
    enableVisibilityAware = true,
    enableNetworkAware = true,
    ...managerOptions
  } = options;

  if (enableNetworkAware) {
    return new NetworkAwarePollingManager(callback, config, managerOptions);
  } else if (enableVisibilityAware) {
    return new VisibilityAwarePollingManager(callback, config, managerOptions);
  } else {
    return new PollingManager(callback, config, managerOptions);
  }
};
