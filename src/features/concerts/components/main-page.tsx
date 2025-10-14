'use client';

import React, { useEffect } from 'react';
import { ConcertListProvider, useConcertListContext } from '@/features/concerts/context/concert-list-context';
import { ConcertList } from './concert-list';
import { ToastNotification } from '@/components/ui/toast-notification';

// 메인 페이지 내부 컴포넌트 (Context 내부에서 사용)
function MainPageContent() {
  const { state, handlers } = useConcertListContext();

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    handlers.onMount();
    
    return () => {
      handlers.onUnmount();
    };
  }, [handlers]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* 헤더 섹션 */}
      <header className="bg-white shadow-sm border-b border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              콘서트 예매
            </h1>
            <p className="text-slate-600 max-w-2xl mx-auto">
              최고의 공연을 만나보세요. 간편하고 빠른 예매 시스템으로 원하는 콘서트를 90초 안에 예매할 수 있습니다.
            </p>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main>
        <ConcertList />
      </main>

      {/* 푸터 */}
      <footer className="bg-white border-t border-slate-200 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-slate-500">
            <p>© 2025 콘서트 예매 시스템. All rights reserved.</p>
            <p className="mt-1">
              문의사항이 있으시면 고객센터 1588-0000으로 연락주세요.
            </p>
          </div>
        </div>
      </footer>

      {/* 토스트 알림 */}
      {state.toastMessage && (
        <ToastNotification
          type={state.toastMessage.type}
          message={state.toastMessage.message}
          onClose={handlers.onToastClose}
          duration={4000}
          position="top"
        />
      )}
    </div>
  );
}

// 메인 페이지 컴포넌트 (Provider로 감싸진 버전)
export function MainPage() {
  return (
    <ConcertListProvider
      config={{
        maxRetryCount: 3,
        retryDelay: 2000,
        enableAutoRetry: true,
        toastDuration: 4000,
        enableCaching: true,
        cacheTimeout: 300000, // 5분
      }}
      onStateChange={(state) => {
        // 상태 변화 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log('Concert List State Changed:', state);
        }
      }}
      onError={(error) => {
        // 에러 로깅
        console.error('Concert List Error:', error);
      }}
      onSuccess={(concerts) => {
        // 성공 로깅 (개발 환경에서만)
        if (process.env.NODE_ENV === 'development') {
          console.log('Concert List Loaded:', concerts.length, 'concerts');
        }
      }}
    >
      <MainPageContent />
    </ConcertListProvider>
  );
}
