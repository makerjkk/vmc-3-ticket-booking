// 검증 결과 타입
export interface ValidationResult {
  isValid: boolean;
  error: string | null;
}

/**
 * 이름 검증 (2-50자, 한글/영문/공백만)
 */
export const validateName = (name: string): ValidationResult => {
  if (!name || name.trim().length === 0) {
    return { isValid: false, error: '이름을 입력해주세요' };
  }

  if (name.length < 2) {
    return { isValid: false, error: '이름은 최소 2자 이상 입력해주세요' };
  }

  if (name.length > 50) {
    return { isValid: false, error: '이름은 최대 50자까지 입력 가능합니다' };
  }

  if (!/^[가-힣a-zA-Z\s]+$/.test(name)) {
    return { isValid: false, error: '이름은 한글, 영문, 공백만 입력 가능합니다' };
  }

  return { isValid: true, error: null };
};

/**
 * 휴대폰 번호 검증 (010-XXXX-XXXX)
 */
export const validatePhone = (phone: string): ValidationResult => {
  if (!phone || phone.trim().length === 0) {
    return { isValid: false, error: '휴대폰 번호를 입력해주세요' };
  }

  if (!/^010-\d{4}-\d{4}$/.test(phone)) {
    return {
      isValid: false,
      error: '휴대폰 번호는 010-1234-5678 형식으로 입력해주세요',
    };
  }

  return { isValid: true, error: null };
};

/**
 * 이메일 검증 (선택)
 */
export const validateEmail = (email: string): ValidationResult => {
  // 빈 값은 허용 (선택 입력)
  if (!email || email.trim().length === 0) {
    return { isValid: true, error: null };
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { isValid: false, error: '올바른 이메일 형식이 아닙니다' };
  }

  return { isValid: true, error: null };
};

/**
 * 휴대폰 번호 자동 포맷팅 (010-XXXX-XXXX)
 */
export const formatPhoneNumber = (value: string): string => {
  // 숫자만 추출
  const numbers = value.replace(/\D/g, '');

  // 11자리 초과 방지
  const truncated = numbers.slice(0, 11);

  // 자동 하이픈 삽입
  if (truncated.length <= 3) return truncated;
  if (truncated.length <= 7)
    return `${truncated.slice(0, 3)}-${truncated.slice(3)}`;
  return `${truncated.slice(0, 3)}-${truncated.slice(3, 7)}-${truncated.slice(7, 11)}`;
};

/**
 * 가격 포맷팅 (1,000,000원)
 */
export const formatPrice = (price: number): string => {
  return `${price.toLocaleString('ko-KR')}원`;
};

