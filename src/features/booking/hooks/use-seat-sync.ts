'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSeatSelection } from '../context/seat-selection-context';
import { createSeatSyncManager, type SeatSyncManager } from '../lib/seat-sync-manager';
import type { Seat, ConnectionStatus } from '../lib/dto';

export interface SeatSyncHookReturn {
  // State
  isPollingActive: boolean;
  lastSyncTime: number | null;
  connectionStatus: ConnectionStatus;
  conflictSeats: string[];
  
  // Actions
  startPolling: () => void;
  stopPolling: () => void;
  forceSync: () => Promise<void>;
  
  // Events
  onConflictDetected: (callback: (seats: string[]) => void) => void;
  onConnectionChange: (callback: (status: ConnectionStatus) => void) => void;
  
  // Utils
  getTimeSinceLastSync: () => number | null;
  isConnected: () => boolean;
}

export const useSeatSync = (
  scheduleId: string,
  options?: {
    interval?: number;
    maxRetries?: number;
    autoStart?: boolean;
    onError?: (error: Error) => void;
  }
): SeatSyncHookReturn => {
  const {
    state,
    actions,
    syncActions,
  } = useSeatSelection();

  const {
    interval = 3000,
    maxRetries = 3,
    autoStart = true,
    onError,
  } = options || {};

  const syncManagerRef = useRef<SeatSyncManager | null>(null);
  const syncActionsRef = useRef(syncActions);
  const [conflictCallbacks, setConflictCallbacks] = useState<Array<(seats: string[]) => void>>([]);
  const [connectionCallbacks, setConnectionCallbacks] = useState<Array<(status: ConnectionStatus) => void>>([]);

  // syncActions ref 업데이트
  useEffect(() => {
    syncActionsRef.current = syncActions;
  }, [syncActions]);

  // 좌석 업데이트 핸들러
  const handleSeatUpdate = useCallback((seats: Seat[]) => {
    syncActionsRef.current.syncSeatsSuccess(seats, Date.now());
  }, []);

  // 충돌 감지 핸들러
  const handleConflictDetected = useCallback((conflictSeats: string[]) => {
    syncActionsRef.current.handleConflict(conflictSeats);
    
    // 등록된 콜백들 호출
    conflictCallbacks.forEach(callback => {
      try {
        callback(conflictSeats);
      } catch (error) {
        console.error('Conflict callback error:', error);
      }
    });
  }, [conflictCallbacks]);

  // 에러 핸들러
  const handleSyncError = useCallback((error: Error) => {
    syncActionsRef.current.syncSeatsError(error.message);
    
    // 에러 콜백 호출
    onError?.(error);
  }, [onError]);


  // 폴링 시작
  const startPolling = useCallback(() => {
    if (!syncManagerRef.current) {
      console.warn('Sync manager not initialized');
      return;
    }

    syncManagerRef.current.start();
    
    // 연결 상태는 SyncManager에서 관리
  }, []);

  // 폴링 중지
  const stopPolling = useCallback(() => {
    if (syncManagerRef.current) {
      syncManagerRef.current.stop();
    }
    
    // 연결 상태는 SyncManager에서 관리
  }, []);

  // 강제 동기화
  const forceSync = useCallback((): Promise<void> => {
    if (!syncManagerRef.current) {
      console.error('Sync manager not initialized');
      return Promise.resolve();
    }

    // Promise를 반환하지만 async/await 사용하지 않음
    return syncManagerRef.current.forceSync().catch(error => {
      // 에러는 handleSyncError에서 처리됨
      console.error('Force sync failed:', error);
      throw error;
    });
  }, []);

  // 충돌 감지 콜백 등록
  const onConflictDetected = useCallback((callback: (seats: string[]) => void) => {
    setConflictCallbacks(prev => [...prev, callback]);
    
    // 정리 함수 반환
    return () => {
      setConflictCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // 연결 상태 변화 콜백 등록
  const onConnectionChange = useCallback((callback: (status: ConnectionStatus) => void) => {
    setConnectionCallbacks(prev => [...prev, callback]);
    
    // 정리 함수 반환
    return () => {
      setConnectionCallbacks(prev => prev.filter(cb => cb !== callback));
    };
  }, []);

  // 마지막 동기화 이후 경과 시간 계산
  const getTimeSinceLastSync = useCallback(() => {
    if (!state.sync.lastSyncTime) return null;
    return Date.now() - state.sync.lastSyncTime;
  }, [state.sync.lastSyncTime]);

  // 연결 상태 확인
  const isConnected = useCallback(() => {
    return state.sync.connectionStatus.status === 'connected';
  }, [state.sync.connectionStatus.status]);

  // 초기화 및 정리
  useEffect(() => {
    if (!scheduleId) return;

    // 기존 매니저 정리
    if (syncManagerRef.current) {
      syncManagerRef.current.destroy();
    }

    // 새 매니저 생성
    syncManagerRef.current = createSeatSyncManager(scheduleId, {
      onUpdate: handleSeatUpdate,
      onConflict: handleConflictDetected,
      onError: handleSyncError,
      interval,
      maxRetries,
    });

    // 자동 시작
    if (autoStart) {
      syncManagerRef.current.start();
    }

    return () => {
      if (syncManagerRef.current) {
        syncManagerRef.current.destroy();
        syncManagerRef.current = null;
      }
    };
  }, [scheduleId, handleSeatUpdate, handleConflictDetected, handleSyncError, interval, maxRetries, autoStart]);


  // 연결 상태 변화 감지 및 콜백 호출
  useEffect(() => {
    connectionCallbacks.forEach(callback => {
      try {
        callback(state.sync.connectionStatus);
      } catch (error) {
        console.error('Connection callback error:', error);
      }
    });
  }, [state.sync.connectionStatus, connectionCallbacks]);

  // 페이지 가시성 변화 처리
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 페이지가 숨겨지면 폴링 중지
        if (state.sync.pollingActive) {
          stopPolling();
        }
      } else {
        // 페이지가 다시 보이면 폴링 재시작
        if (!state.sync.pollingActive && autoStart) {
          startPolling();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state.sync.pollingActive, autoStart, startPolling, stopPolling]);

  return {
    // State
    isPollingActive: state.sync.pollingActive,
    lastSyncTime: state.sync.lastSyncTime,
    connectionStatus: state.sync.connectionStatus,
    conflictSeats: state.sync.conflictSeats,

    // Actions
    startPolling,
    stopPolling,
    forceSync,

    // Events
    onConflictDetected,
    onConnectionChange,

    // Utils
    getTimeSinceLastSync,
    isConnected,
  };
};
