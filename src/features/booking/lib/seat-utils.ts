import type { Seat, SeatStatus, SeatRow } from './dto';

// 좌석 등급별 색상 매핑
export const SEAT_GRADE_COLORS = {
  R: '#5C6BFF', // Primary Color - R석
  S: '#28E0FF', // Secondary Color - S석  
  A: '#FF46B5', // Accent Color - A석
} as const;

// 좌석 상태별 색상 매핑
export const SEAT_STATUS_COLORS = {
  available: '#F3F4FF', // Light Slate - 선택 가능
  selected: '#5C6BFF',   // Primary Color - 선택됨
  reserved: '#6B7280',   // Gray - 예약됨
  held: '#28E0FF',       // Secondary Color - 홀드됨
  conflict: '#EF4444',   // Red - 충돌
} as const;

/**
 * 좌석 상태 결정
 */
export const getSeatStatus = (
  seat: Seat, 
  isSelected: boolean, 
  isConflict: boolean
): SeatStatus => {
  if (isConflict) return 'conflict';
  if (isSelected) return 'selected';
  if (seat.status === 'reserved') return 'reserved';
  if (seat.status === 'held') return 'held';
  return 'available';
};

/**
 * 좌석을 행별로 그룹화
 */
export const groupSeatsByRow = (seats: Seat[]): SeatRow[] => {
  const rowMap = new Map<string, Seat[]>();
  
  seats.forEach(seat => {
    const rowName = seat.rowName;
    if (!rowMap.has(rowName)) {
      rowMap.set(rowName, []);
    }
    rowMap.get(rowName)!.push(seat);
  });
  
  return Array.from(rowMap.entries())
    .map(([rowName, seats]) => ({
      rowName,
      seats: seats.sort((a, b) => a.seatIndex - b.seatIndex)
    }))
    .sort((a, b) => a.rowName.localeCompare(b.rowName));
};

/**
 * 좌석을 등급별로 그룹화
 */
export const groupSeatsByGrade = (seats: Seat[]): Record<string, Seat[]> => {
  const gradeMap: Record<string, Seat[]> = { R: [], S: [], A: [] };
  
  seats.forEach(seat => {
    if (gradeMap[seat.grade]) {
      gradeMap[seat.grade].push(seat);
    }
  });
  
  return gradeMap;
};

/**
 * 총 가격 계산
 */
export const calculateTotalPrice = (seats: Seat[]): number => {
  return seats.reduce((total, seat) => total + seat.price, 0);
};

/**
 * 등급별 가격 분석
 */
export const calculatePriceBreakdown = (seatsByGrade: Record<string, Seat[]>) => {
  return Object.entries(seatsByGrade)
    .filter(([_, seats]) => seats.length > 0)
    .map(([grade, seats]) => ({
      grade,
      count: seats.length,
      unitPrice: seats[0]?.price || 0,
      totalPrice: calculateTotalPrice(seats),
    }));
};

/**
 * 가격 포맷팅
 */
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price);
};

/**
 * 좌석 번호 포맷팅
 */
export const formatSeatNumber = (seat: Seat): string => {
  return `${seat.rowName}열 ${seat.seatIndex}번`;
};

/**
 * 좌석 목록 포맷팅
 */
export const formatSeatList = (seats: Seat[]): string => {
  if (seats.length === 0) return '';
  if (seats.length === 1) return formatSeatNumber(seats[0]);
  
  const seatsByRow = groupSeatsByRow(seats);
  
  return seatsByRow
    .map(row => {
      const seatNumbers = row.seats
        .map(seat => seat.seatIndex.toString())
        .join(', ');
      return `${row.rowName}열 ${seatNumbers}번`;
    })
    .join(' / ');
};

/**
 * 접근성 라벨 생성
 */
export const getSeatAriaLabel = (seat: Seat, status: SeatStatus): string => {
  const baseLabel = `${seat.rowName}열 ${seat.seatIndex}번 좌석, ${seat.grade}석, ${formatPrice(seat.price)}`;
  
  switch (status) {
    case 'available':
      return `${baseLabel}, 선택 가능`;
    case 'selected':
      return `${baseLabel}, 선택됨`;
    case 'reserved':
      return `${baseLabel}, 예약됨`;
    case 'held':
      return `${baseLabel}, 다른 사용자가 선택 중`;
    case 'conflict':
      return `${baseLabel}, 충돌 발생`;
    default:
      return baseLabel;
  }
};

/**
 * 좌석 CSS 클래스명 생성
 */
export const getSeatClassName = (seat: Seat, status: SeatStatus): string => {
  const baseClass = 'seat-cell';
  const gradeClass = `seat-cell--grade-${seat.grade.toLowerCase()}`;
  const statusClass = `seat-cell--${status}`;
  
  const classes = [baseClass, gradeClass, statusClass];
  
  // 접근성 관련 클래스
  if (seat.metadata?.isAccessible) {
    classes.push('seat-cell--accessible');
  }
  
  if (seat.metadata?.hasObstruction) {
    classes.push('seat-cell--obstructed');
  }
  
  return classes.join(' ');
};

/**
 * 좌석 선택 가능 여부 확인
 */
export const isSeatSelectable = (seat: Seat): boolean => {
  return seat.status === 'available';
};

/**
 * 좌석 선택 불가 메시지 생성
 */
export const getSeatUnavailableMessage = (seat: Seat): string => {
  switch (seat.status) {
    case 'reserved':
      return '이미 예약된 좌석입니다';
    case 'held':
      return '다른 사용자가 선택 중인 좌석입니다';
    default:
      return '선택할 수 없는 좌석입니다';
  }
};

/**
 * 키보드 네비게이션 - 인접 좌석 찾기
 */
export const findAdjacentSeat = (
  currentSeat: Seat,
  rowSeats: Seat[],
  direction: -1 | 1
): Seat | null => {
  const currentIndex = rowSeats.findIndex(seat => seat.id === currentSeat.id);
  if (currentIndex === -1) return null;
  
  const nextIndex = currentIndex + direction;
  if (nextIndex < 0 || nextIndex >= rowSeats.length) return null;
  
  return rowSeats[nextIndex];
};

/**
 * 키보드 네비게이션 - 다른 행의 좌석 찾기
 */
export const findSeatInRow = (
  currentSeat: Seat,
  allSeats: Seat[],
  allRows: string[],
  direction: -1 | 1
): Seat | null => {
  const currentRowIndex = allRows.indexOf(currentSeat.rowName);
  if (currentRowIndex === -1) return null;
  
  const nextRowIndex = currentRowIndex + direction;
  if (nextRowIndex < 0 || nextRowIndex >= allRows.length) return null;
  
  const nextRowName = allRows[nextRowIndex];
  const nextRowSeats = allSeats.filter(seat => seat.rowName === nextRowName);
  
  // 같은 인덱스의 좌석을 찾거나, 가장 가까운 좌석 반환
  const targetSeat = nextRowSeats.find(seat => seat.seatIndex === currentSeat.seatIndex);
  if (targetSeat) return targetSeat;
  
  // 가장 가까운 좌석 찾기
  const sortedSeats = nextRowSeats.sort((a, b) => 
    Math.abs(a.seatIndex - currentSeat.seatIndex) - Math.abs(b.seatIndex - currentSeat.seatIndex)
  );
  
  return sortedSeats[0] || null;
};

/**
 * 키보드 네비게이션 핸들러
 */
export const handleArrowNavigation = (
  key: string,
  currentSeat: Seat,
  allSeats: Seat[]
): Seat | null => {
  const currentRow = allSeats.filter(s => s.rowName === currentSeat.rowName);
  const allRows = Array.from(new Set(allSeats.map(s => s.rowName))).sort();
  
  switch (key) {
    case 'ArrowLeft':
      return findAdjacentSeat(currentSeat, currentRow, -1);
    case 'ArrowRight':
      return findAdjacentSeat(currentSeat, currentRow, 1);
    case 'ArrowUp':
      return findSeatInRow(currentSeat, allSeats, allRows, -1);
    case 'ArrowDown':
      return findSeatInRow(currentSeat, allSeats, allRows, 1);
    default:
      return null;
  }
};

/**
 * 좌석 배치도 SVG 좌표 계산
 */
export const calculateSeatPosition = (
  seat: Seat,
  containerWidth: number,
  containerHeight: number,
  seatSize: number = 32,
  gap: number = 4
): { x: number; y: number } => {
  // 기본적으로 seat의 xPosition, yPosition 사용
  if (seat.xPosition !== undefined && seat.yPosition !== undefined) {
    return {
      x: seat.xPosition,
      y: seat.yPosition,
    };
  }
  
  // fallback: 행과 인덱스 기반 계산
  const rowIndex = seat.rowName.charCodeAt(0) - 65; // A=0, B=1, ...
  const seatIndex = seat.seatIndex - 1; // 1-based to 0-based
  
  const x = seatIndex * (seatSize + gap) + gap;
  const y = rowIndex * (seatSize + gap) + gap;
  
  return { x, y };
};

/**
 * 좌석 배치도 뷰박스 계산
 */
export const calculateViewBox = (
  seats: Seat[],
  seatSize: number = 32,
  gap: number = 4,
  padding: number = 20
): { width: number; height: number; viewBox: string } => {
  if (seats.length === 0) {
    return { width: 400, height: 300, viewBox: '0 0 400 300' };
  }
  
  const positions = seats.map(seat => 
    calculateSeatPosition(seat, 0, 0, seatSize, gap)
  );
  
  const minX = Math.min(...positions.map(p => p.x));
  const maxX = Math.max(...positions.map(p => p.x));
  const minY = Math.min(...positions.map(p => p.y));
  const maxY = Math.max(...positions.map(p => p.y));
  
  const width = maxX - minX + seatSize + (padding * 2);
  const height = maxY - minY + seatSize + (padding * 2);
  
  const viewBox = `${minX - padding} ${minY - padding} ${width} ${height}`;
  
  return { width, height, viewBox };
};

/**
 * 좌석 충돌 감지
 */
export const detectConflicts = (
  currentLayoutSeats: Seat[],
  selectedSeats: Seat[]
): string[] => {
  const conflictIds: string[] = [];
  const currentStatusMap = new Map(currentLayoutSeats.map(s => [s.id, s.status]));

  selectedSeats.forEach(selected => {
    const currentStatus = currentStatusMap.get(selected.id);
    // 'available'이 아니면 충돌로 간주 (reserved, held 등)
    if (currentStatus && currentStatus !== 'available') {
      conflictIds.push(selected.id);
    }
  });
  return conflictIds;
};

/**
 * 좌석 통계 계산
 */
export const calculateSeatStatistics = (seats: Seat[]) => {
  const total = seats.length;
  const available = seats.filter(s => s.status === 'available').length;
  const reserved = seats.filter(s => s.status === 'reserved').length;
  const held = seats.filter(s => s.status === 'held').length;
  
  const availabilityRate = total > 0 ? (available / total) * 100 : 0;
  
  const gradeStats = groupSeatsByGrade(seats);
  const gradeAvailability = Object.entries(gradeStats).map(([grade, gradeSeats]) => ({
    grade,
    total: gradeSeats.length,
    available: gradeSeats.filter(s => s.status === 'available').length,
    rate: gradeSeats.length > 0 
      ? (gradeSeats.filter(s => s.status === 'available').length / gradeSeats.length) * 100 
      : 0,
  }));
  
  return {
    total,
    available,
    reserved,
    held,
    availabilityRate,
    gradeAvailability,
  };
};
