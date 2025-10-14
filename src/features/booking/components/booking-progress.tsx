'use client';

import { memo } from 'react';
import { useBookingProgress } from '../context/schedule-selection-context';

// 진행 단계 정의
const PROGRESS_STEPS = [
  { key: 'date', label: '날짜 선택', icon: 'calendar' },
  { key: 'schedule', label: '회차 선택', icon: 'clock' },
  { key: 'seat', label: '좌석 선택', icon: 'seat' },
  { key: 'payment', label: '결제', icon: 'payment' },
] as const;

// 아이콘 컴포넌트
const StepIcon = memo<{ type: string; isActive: boolean; isCompleted: boolean }>(({ 
  type, 
  isActive, 
  isCompleted 
}) => {
  const getIconColor = () => {
    if (isCompleted) return 'text-white';
    if (isActive) return 'text-blue-600';
    return 'text-gray-400';
  };

  const iconProps = {
    className: `w-5 h-5 ${getIconColor()}`,
    fill: 'none',
    stroke: 'currentColor',
    viewBox: '0 0 24 24',
    strokeWidth: 2,
  };

  switch (type) {
    case 'calendar':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'seat':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      );
    case 'payment':
      return (
        <svg {...iconProps}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      );
    default:
      return (
        <svg {...iconProps}>
          <circle cx="12" cy="12" r="10" />
        </svg>
      );
  }
});

StepIcon.displayName = 'StepIcon';

// 개별 진행 단계 컴포넌트
const ProgressStep = memo<{
  step: typeof PROGRESS_STEPS[number];
  index: number;
  isActive: boolean;
  isCompleted: boolean;
  isLast: boolean;
}>(({ step, index, isActive, isCompleted, isLast }) => {
  return (
    <div className="flex items-center">
      {/* 단계 아이콘 */}
      <div className="flex items-center">
        <div
          className={`
            flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200
            ${isCompleted 
              ? 'bg-blue-600 border-blue-600' 
              : isActive 
                ? 'bg-white border-blue-600' 
                : 'bg-white border-gray-300'
            }
          `}
        >
          {isCompleted ? (
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          ) : (
            <StepIcon type={step.icon} isActive={isActive} isCompleted={isCompleted} />
          )}
        </div>
        
        {/* 단계 라벨 */}
        <div className="ml-3 hidden sm:block">
          <p
            className={`
              text-sm font-medium transition-colors duration-200
              ${isActive ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'}
            `}
          >
            {step.label}
          </p>
        </div>
      </div>

      {/* 연결선 */}
      {!isLast && (
        <div
          className={`
            flex-1 h-0.5 mx-4 transition-colors duration-200
            ${isCompleted ? 'bg-blue-600' : 'bg-gray-300'}
          `}
        />
      )}
    </div>
  );
});

ProgressStep.displayName = 'ProgressStep';

// 메인 진행 상태 컴포넌트
export const BookingProgress = memo(() => {
  const { progress } = useBookingProgress();

  const getCurrentStepIndex = () => {
    return PROGRESS_STEPS.findIndex(step => step.key === progress.currentStep);
  };

  const currentStepIndex = getCurrentStepIndex();
  const progressPercentage = ((currentStepIndex + 1) / PROGRESS_STEPS.length) * 100;

  return (
    <div className="w-full">
      {/* 모바일용 간단한 진행률 바 */}
      <div className="block sm:hidden mb-4">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>예매 진행</span>
          <span>{currentStepIndex + 1} / {PROGRESS_STEPS.length}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="mt-2 text-center">
          <span className="text-sm font-medium text-blue-600">
            {PROGRESS_STEPS[currentStepIndex]?.label}
          </span>
        </div>
      </div>

      {/* 데스크톱용 상세 진행 상태 */}
      <div className="hidden sm:block">
        <div className="flex items-center justify-between">
          {PROGRESS_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            const isLast = index === PROGRESS_STEPS.length - 1;

            return (
              <ProgressStep
                key={step.key}
                step={step}
                index={index}
                isActive={isActive}
                isCompleted={isCompleted}
                isLast={isLast}
              />
            );
          })}
        </div>

        {/* 진행률 텍스트 */}
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">
            {currentStepIndex + 1}단계 / {PROGRESS_STEPS.length}단계 완료
          </p>
        </div>
      </div>

      {/* 접근성을 위한 스크린 리더 텍스트 */}
      <div className="sr-only">
        현재 {PROGRESS_STEPS[currentStepIndex]?.label} 단계입니다. 
        총 {PROGRESS_STEPS.length}단계 중 {currentStepIndex + 1}단계를 진행 중입니다.
      </div>
    </div>
  );
});

BookingProgress.displayName = 'BookingProgress';
