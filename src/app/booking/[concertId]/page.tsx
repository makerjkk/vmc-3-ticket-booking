'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';
import { ScheduleSelectionProvider } from '@/features/booking/context/schedule-selection-context';
import { ScheduleList } from '@/features/booking/components/schedule-list';
import { SeatLayout } from '@/features/booking/components/seat-layout';
import { BookingProgress } from '@/features/booking/components/booking-progress';
import { ScheduleLoadingSkeleton } from '@/features/booking/components/schedule-loading-skeleton';
import { ScheduleErrorMessage } from '@/features/booking/components/schedule-error-message';
import { SessionManager } from '@/features/booking/lib/session-manager';
import { DateTimeUtils } from '@/features/booking/lib/datetime-utils';

// 에러 폴백 컴포넌트
function BookingErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-lg shadow-lg p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            예매 페이지 오류
          </h2>
          <p className="text-gray-600 mb-6">
            예매 페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetErrorBoundary}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              메인으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function BookingPageLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 진행 상태 스켈레톤 */}
        <div className="mb-8">
          <div className="h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-blue-600 rounded-full w-1/4"></div>
          </div>
        </div>
        
        {/* 콘텐츠 스켈레톤 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <ScheduleLoadingSkeleton />
          </div>
          <div className="space-y-4">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 메인 예약 페이지 컴포넌트
function BookingPageContent({ concertId }: { concertId: string }) {
  const router = useRouter();

  // 세션 복원
  useEffect(() => {
    const sessionData = SessionManager.load();
    
    // 다른 콘서트의 세션 데이터가 있으면 정리
    if (sessionData && sessionData.concertId !== concertId) {
      SessionManager.clear();
    }
    
    // 현재 콘서트 ID 저장
    if (!sessionData || sessionData.concertId !== concertId) {
      SessionManager.save({ concertId });
    }
  }, [concertId]);

  // 페이지 이탈 시 세션 연장 확인
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (SessionManager.isValid()) {
        SessionManager.extend();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, []);

  return (
    <ScheduleSelectionProvider concertId={concertId}>
      <div className="min-h-screen bg-gray-50">
        {/* 헤더 */}
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <button
                onClick={() => router.push('/')}
                className="flex items-center text-gray-600 hover:text-gray-900 transition-colors"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                콘서트 목록으로
              </button>
              <h1 className="text-xl font-semibold text-gray-900">
                콘서트 예매
              </h1>
              <div className="w-24"></div> {/* 균형을 위한 빈 공간 */}
            </div>
          </div>
        </header>

        {/* 진행 상태 */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <BookingProgress />
          </div>
        </div>

        {/* 메인 콘텐츠 */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* 회차 선택 영역 */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  회차 선택
                </h2>
                <ScheduleList />
              </div>
            </div>

            {/* 좌석 선택 및 예매 정보 영역 */}
            <div className="space-y-6">
              {/* 좌석 배치도 */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">
                  좌석 선택
                </h3>
                <SeatLayout />
              </div>
            </div>
          </div>
        </main>
      </div>
    </ScheduleSelectionProvider>
  );
}

// 파라미터 검증 컴포넌트
function BookingPageWithValidation() {
  const params = useParams();
  const router = useRouter();
  const concertId = params?.concertId as string;

  // concertId 유효성 검증
  useEffect(() => {
    if (!concertId) {
      router.push('/');
      return;
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(concertId)) {
      router.push('/');
      return;
    }
  }, [concertId, router]);

  if (!concertId) {
    return <BookingPageLoading />;
  }

  return <BookingPageContent concertId={concertId} />;
}

// 메인 페이지 컴포넌트 (Promise 파라미터 지원)
export default function BookingPage() {
  return (
    <ErrorBoundary
      FallbackComponent={BookingErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Booking page error:', error, errorInfo);
        
        // 개발 환경에서 세션 디버그 정보 출력
        if (process.env.NODE_ENV === 'development') {
          SessionManager.debug();
        }
      }}
      onReset={() => {
        // 에러 리셋 시 세션 정리
        SessionManager.clear();
        window.location.reload();
      }}
    >
      <Suspense fallback={<BookingPageLoading />}>
        <BookingPageWithValidation />
      </Suspense>
    </ErrorBoundary>
  );
}
