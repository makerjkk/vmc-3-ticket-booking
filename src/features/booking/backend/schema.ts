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
  grade: z.enum(['R', 'S', 'A']),
  price: z.number().min(0),
  status: z.enum(['available', 'reserved']),
  row: z.number().min(1).optional(),
  col: z.number().min(1).optional(),
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
  grade: z.string(),
  price: z.number(),
  status: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
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
