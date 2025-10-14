'use client';

import { memo } from 'react';
import { useScheduleErrorHandler } from '../hooks/use-schedule-selection';

interface ScheduleErrorMessageProps {
  error: Error;
  onRetry?: () => void;
  className?: string;
}

// 에러 아이콘 컴포넌트
const ErrorIcon = memo<{ type: 'network' | 'server' | 'not-found' | 'generic' }>(({ type }) => {
  const iconProps = {
    className: "w-12 h-12 mx-auto mb-4",
    fill: "none",
    stroke: "currentColor",
    viewBox: "0 0 24 24",
    strokeWidth: 2,
  };

  switch (type) {
    case 'network':
      return (
        <svg {...iconProps} className={`${iconProps.className} text-orange-400`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
        </svg>
      );
    case 'server':
      return (
        <svg {...iconProps} className={`${iconProps.className} text-red-400`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01" />
        </svg>
      );
    case 'not-found':
      return (
        <svg {...iconProps} className={`${iconProps.className} text-gray-400`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps} className={`${iconProps.className} text-red-400`}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      );
  }
});

ErrorIcon.displayName = 'ErrorIcon';

// 메인 에러 메시지 컴포넌트
export const ScheduleErrorMessage = memo<ScheduleErrorMessageProps>(({ 
  error, 
  onRetry, 
  className = '' 
}) => {
  const { handleApiError, getErrorMessage, isRetryableError } = useScheduleErrorHandler();
  
  const apiError = handleApiError(error);
  const errorMessage = getErrorMessage(error);
  const canRetry = isRetryableError(error);

  // 에러 타입 결정
  const getErrorType = () => {
    switch (apiError.code) {
      case 'NETWORK_ERROR':
        return 'network';
      case 'SERVER_ERROR':
      case 'DATABASE_ERROR':
        return 'server';
      case 'SCHEDULE_NOT_FOUND':
      case 'NO_SCHEDULES_AVAILABLE':
        return 'not-found';
      default:
        return 'generic';
    }
  };

  // 에러별 제목 및 설명
  const getErrorContent = () => {
    switch (apiError.code) {
      case 'NETWORK_ERROR':
        return {
          title: '네트워크 연결 오류',
          description: '인터넷 연결을 확인하고 다시 시도해주세요.',
          suggestion: '잠시 후 다시 시도하거나 네트워크 연결을 확인해보세요.',
        };
      case 'SERVER_ERROR':
      case 'DATABASE_ERROR':
        return {
          title: '서버 오류',
          description: '서버에서 일시적인 오류가 발생했습니다.',
          suggestion: '잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터에 문의해주세요.',
        };
      case 'SCHEDULE_NOT_FOUND':
      case 'NO_SCHEDULES_AVAILABLE':
        return {
          title: '회차 정보 없음',
          description: '선택하신 날짜에 예매 가능한 회차가 없습니다.',
          suggestion: '다른 날짜를 선택하거나 나중에 다시 확인해보세요.',
        };
      case 'PAST_DATE_SELECTED':
        return {
          title: '잘못된 날짜',
          description: '과거 날짜는 선택할 수 없습니다.',
          suggestion: '오늘 이후의 날짜를 선택해주세요.',
        };
      default:
        return {
          title: '오류 발생',
          description: errorMessage,
          suggestion: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
        };
    }
  };

  const errorType = getErrorType();
  const errorContent = getErrorContent();

  return (
    <div className={`text-center py-12 ${className}`}>
      <ErrorIcon type={errorType} />
      
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {errorContent.title}
      </h3>
      
      <p className="text-gray-600 mb-2">
        {errorContent.description}
      </p>
      
      <p className="text-sm text-gray-500 mb-6">
        {errorContent.suggestion}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {/* 재시도 버튼 */}
        {canRetry && onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            다시 시도
          </button>
        )}

        {/* 메인으로 돌아가기 버튼 */}
        <button
          onClick={() => window.location.href = '/'}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          메인으로 돌아가기
        </button>
      </div>

      {/* 개발 환경에서 에러 상세 정보 표시 */}
      {process.env.NODE_ENV === 'development' && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
            개발자 정보 (개발 환경에서만 표시)
          </summary>
          <div className="mt-2 p-4 bg-gray-100 rounded-lg text-sm text-gray-700">
            <div className="mb-2">
              <strong>Error Code:</strong> {apiError.code}
            </div>
            <div className="mb-2">
              <strong>Error Message:</strong> {apiError.message}
            </div>
            {apiError.details && (
              <div>
                <strong>Details:</strong>
                <pre className="mt-1 text-xs overflow-auto">
                  {JSON.stringify(apiError.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
});

ScheduleErrorMessage.displayName = 'ScheduleErrorMessage';

// 간단한 인라인 에러 메시지
export const InlineErrorMessage = memo<{ 
  message: string; 
  onRetry?: () => void;
  className?: string;
}>(({ message, onRetry, className = '' }) => (
  <div className={`flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg ${className}`}>
    <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
    </svg>
    
    <div className="flex-1">
      <p className="text-sm text-red-800">{message}</p>
    </div>
    
    {onRetry && (
      <button
        onClick={onRetry}
        className="text-sm text-red-600 hover:text-red-800 font-medium"
      >
        재시도
      </button>
    )}
  </div>
));

InlineErrorMessage.displayName = 'InlineErrorMessage';
