import { z } from 'zod';

// 회차 목록 조회 요청 스키마
export const ScheduleListRequestSchema = z.object({
  concertId: z.string().uuid('유효한 콘서트 ID가 필요합니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '날짜는 YYYY-MM-DD 형식이어야 합니다'),
});

// 회차 정보 스키마
export const ScheduleItemSchema = z.object({
  id: z.string().uuid(),
  concertId: z.string().uuid(),
  dateTime: z.string(),
  availableSeats: z.number().min(0),
  totalSeats: z.number().min(0),
  isSoldOut: z.boolean(),
  isAlmostSoldOut: z.boolean(), // 잔여 10석 이하
});

// 회차 목록 응답 스키마
export const ScheduleListResponseSchema = z.object({
  schedules: z.array(ScheduleItemSchema),
  total: z.number().min(0),
  selectedDate: z.string(),
});

// 회차 상세 조회 요청 스키마
export const ScheduleDetailRequestSchema = z.object({
  scheduleId: z.string().uuid('유효한 회차 ID가 필요합니다'),
});

// 좌석 정보 스키마
export const SeatDataSchema = z.object({
  id: z.string().uuid(),
  scheduleId: z.string().uuid(),
  seatNumber: z.string().min(1),
  rowName: z.string().min(1),
  seatIndex: z.number().min(1),
  grade: z.enum(['R', 'S', 'A']),
  price: z.number().min(0),
  status: z.enum(['available', 'reserved', 'held']),
  xPosition: z.number().optional(),
  yPosition: z.number().optional(),
  metadata: z.object({
    isAccessible: z.boolean().optional(),
    hasObstruction: z.boolean().optional(),
    sightlineRating: z.number().min(1).max(5).optional(),
  }).optional(),
});

// 좌석 배치도 응답 스키마
export const SeatLayoutResponseSchema = z.object({
  scheduleId: z.string().uuid(),
  seats: z.array(SeatDataSchema),
  totalSeats: z.number().min(0),
  availableSeats: z.number().min(0),
  gradeInfo: z.array(z.object({
    grade: z.enum(['R', 'S', 'A']),
    price: z.number().min(0),
    color: z.string(),
    totalSeats: z.number().min(0),
    availableSeats: z.number().min(0),
  })),
});

// 실시간 좌석 수 업데이트 스키마
export const SeatCountUpdateSchema = z.object({
  scheduleId: z.string().uuid(),
  availableSeats: z.number().min(0),
  totalSeats: z.number().min(0),
  lastUpdated: z.string(),
  gradeBreakdown: z.array(z.object({
    grade: z.enum(['R', 'S', 'A']),
    availableSeats: z.number().min(0),
    totalSeats: z.number().min(0),
  })),
});

// 회차 예매 가능 여부 검증 스키마
export const ScheduleAvailabilitySchema = z.object({
  scheduleId: z.string().uuid(),
  available: z.boolean(),
  reason: z.string().optional(),
  availableSeats: z.number().min(0),
});

// 데이터베이스 테이블 스키마
export const ScheduleTableRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  date_time: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const SeatTableRowSchema = z.object({
  id: z.string().uuid(),
  schedule_id: z.string().uuid(),
  seat_number: z.string(),
  row_name: z.string(),
  seat_index: z.number(),
  grade: z.string(),
  price: z.number(),
  status: z.string(),
  x_position: z.number().nullable(),
  y_position: z.number().nullable(),
  is_accessible: z.boolean().nullable(),
  has_obstruction: z.boolean().nullable(),
  sightline_rating: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

// 좌석 홀드 요청 스키마
export const SeatHoldRequestSchema = z.object({
  scheduleId: z.string().uuid('유효한 회차 ID가 필요합니다'),
  seatIds: z.array(z.string().uuid()).min(1, '최소 1개의 좌석을 선택해야 합니다').max(4, '최대 4개의 좌석까지 선택할 수 있습니다'),
  holdDuration: z.number().min(60).max(600).default(300), // 1분~10분, 기본 5분
});

// 좌석 홀드 응답 스키마
export const SeatHoldResponseSchema = z.object({
  holdId: z.string().uuid(),
  seatIds: z.array(z.string().uuid()),
  expiresAt: z.string(),
  holdDuration: z.number(),
});

// 좌석 상태 업데이트 스키마
export const SeatStatusUpdateSchema = z.object({
  scheduleId: z.string().uuid(),
  seats: z.array(SeatDataSchema),
  timestamp: z.string(),
  conflicts: z.array(z.string().uuid()).optional(),
});

// 좌석 충돌 응답 스키마
export const SeatConflictResponseSchema = z.object({
  conflictSeats: z.array(z.string().uuid()),
  message: z.string(),
  suggestedSeats: z.array(SeatDataSchema).optional(),
});

// 타입 추론
export type ScheduleListRequest = z.infer<typeof ScheduleListRequestSchema>;
export type ScheduleItem = z.infer<typeof ScheduleItemSchema>;
export type ScheduleListResponse = z.infer<typeof ScheduleListResponseSchema>;
export type ScheduleDetailRequest = z.infer<typeof ScheduleDetailRequestSchema>;
export type SeatData = z.infer<typeof SeatDataSchema>;
export type SeatLayoutResponse = z.infer<typeof SeatLayoutResponseSchema>;
export type SeatCountUpdate = z.infer<typeof SeatCountUpdateSchema>;
export type ScheduleAvailability = z.infer<typeof ScheduleAvailabilitySchema>;
export type ScheduleTableRow = z.infer<typeof ScheduleTableRowSchema>;
export type SeatTableRow = z.infer<typeof SeatTableRowSchema>;
export type SeatHoldRequest = z.infer<typeof SeatHoldRequestSchema>;
export type SeatHoldResponse = z.infer<typeof SeatHoldResponseSchema>;
export type SeatStatusUpdate = z.infer<typeof SeatStatusUpdateSchema>;
export type SeatConflictResponse = z.infer<typeof SeatConflictResponseSchema>;
