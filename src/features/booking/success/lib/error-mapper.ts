import type { ErrorInfo } from '../types/state';

/**
 * API 에러를 ErrorInfo로 매핑
 */
export function mapApiErrorToErrorInfo(
  errorCode:
    | 'NOT_FOUND'
    | 'SERVER_ERROR'
    | 'NETWORK_ERROR'
    | 'INVALID_ID'
    | 'MISSING_ID'
    | number
    | undefined
): ErrorInfo {
  if (typeof errorCode === 'number') {
    if (errorCode === 404) {
      return {
        code: 'NOT_FOUND',
        message: '예약 정보를 찾을 수 없습니다. 예약 번호를 확인해주세요.',
        retryable: false,
      };
    }
    if (errorCode >= 500) {
      return {
        code: 'SERVER_ERROR',
        message: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
        retryable: true,
      };
    }
  }

  if (errorCode === 'MISSING_ID') {
    return {
      code: 'MISSING_ID',
      message: '예약 번호가 없습니다. 올바른 경로로 접근해주세요.',
      retryable: false,
    };
  }

  if (errorCode === 'NOT_FOUND') {
    return {
      code: 'NOT_FOUND',
      message: '예약 정보를 찾을 수 없습니다.',
      retryable: false,
    };
  }

  return {
    code: 'NETWORK_ERROR',
    message: '네트워크 오류가 발생했습니다. 다시 시도해주세요.',
    retryable: true,
  };
}

