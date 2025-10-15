'use client';

import { Suspense, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ErrorBoundary } from 'react-error-boundary';
import { SeatSelectionPage } from '@/features/booking/components/seat-selection-page';

// 에러 폴백 컴포넌트
function SeatSelectionErrorFallback({ 
  error, 
  resetErrorBoundary 
}: { 
  error: Error; 
  resetErrorBoundary: () => void 
}) {
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
            좌석 선택 오류
          </h2>
          <p className="text-gray-600 mb-6">
            좌석 선택 페이지를 불러오는 중 오류가 발생했습니다.
          </p>
          <div className="space-y-3">
            <button
              onClick={resetErrorBoundary}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
            >
              다시 시도
            </button>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
            >
              이전으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// 로딩 컴포넌트
function SeatSelectionLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌석 그리드 로딩 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="mb-6">
                <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
              
              {/* 좌석 그리드 스켈레톤 */}
              <div className="space-y-2">
                {Array.from({ length: 8 }).map((_, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-2">
                    <div className="w-6 h-6 bg-gray-200 rounded"></div>
                    <div className="flex gap-1">
                      {Array.from({ length: 12 }).map((_, seatIndex) => (
                        <div key={seatIndex} className="w-8 h-8 bg-gray-200 rounded"></div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* 예약 정보 로딩 */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-6 bg-gray-200 rounded w-2/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="h-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 파라미터 검증 컴포넌트
function SeatSelectionPageWithValidation() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const concertId = params?.concertId as string;
  const scheduleId = searchParams?.get('scheduleId');

  // 파라미터 유효성 검증
  useEffect(() => {
    if (!concertId || !scheduleId) {
      // 필수 파라미터가 없으면 예약 페이지로 리다이렉트
      router.push(`/booking/${concertId || ''}`);
      return;
    }

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    
    if (!uuidRegex.test(concertId) || !uuidRegex.test(scheduleId)) {
      router.push('/');
      return;
    }
  }, [concertId, scheduleId, router]);

  if (!concertId || !scheduleId) {
    return <SeatSelectionLoading />;
  }

  return (
    <SeatSelectionPage 
      scheduleId={scheduleId}
      concertId={concertId}
    />
  );
}

// 메인 좌석 선택 페이지 컴포넌트
export default function SeatSelectionPageRoute() {
  return (
    <ErrorBoundary
      FallbackComponent={SeatSelectionErrorFallback}
      onError={(error, errorInfo) => {
        console.error('Seat selection page error:', error, errorInfo);
      }}
      onReset={() => {
        // 에러 리셋 시 페이지 새로고침
        window.location.reload();
      }}
    >
      <Suspense fallback={<SeatSelectionLoading />}>
        <SeatSelectionPageWithValidation />
      </Suspense>
    </ErrorBoundary>
  );
}
