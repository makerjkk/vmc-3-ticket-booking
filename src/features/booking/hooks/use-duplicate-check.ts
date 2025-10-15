import { useState, useCallback } from 'react';
import { apiClient } from '@/lib/remote/api-client';

interface DuplicateCheckResult {
  isDuplicate: boolean;
  reservationNumber?: string;
  message?: string;
}

/**
 * 전화번호 기반 예약 중복 확인 훅
 */
export const useDuplicateCheck = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [duplicateInfo, setDuplicateInfo] = useState<DuplicateCheckResult | null>(null);

  const checkDuplicate = useCallback(
    async (scheduleId: string, customerPhone: string): Promise<DuplicateCheckResult | null> => {
      // 전화번호가 완전하지 않으면 체크하지 않음
      if (!customerPhone || customerPhone.length < 12) {
        setDuplicateInfo(null);
        return null;
      }

      setIsChecking(true);
      
      try {
        const response = await apiClient.get<DuplicateCheckResult>(
          `/api/booking/check-duplicate?scheduleId=${scheduleId}&customerPhone=${encodeURIComponent(customerPhone)}`
        );

        // 백엔드 respond() 함수는 성공 시 data 필드만 반환
        if (response.data) {
          setDuplicateInfo(response.data);
          return response.data;
        }

        setDuplicateInfo(null);
        return null;
      } catch (error) {
        console.error('중복 확인 오류:', error);
        setDuplicateInfo(null);
        return null;
      } finally {
        setIsChecking(false);
      }
    },
    []
  );

  const clearDuplicateInfo = useCallback(() => {
    setDuplicateInfo(null);
  }, []);

  return {
    isChecking,
    duplicateInfo,
    checkDuplicate,
    clearDuplicateInfo,
  };
};

