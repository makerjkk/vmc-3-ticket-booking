import { z } from 'zod';

// 콘서트 목록 조회 응답 스키마
export const ConcertItemSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, '콘서트 제목은 필수입니다'),
  posterImageUrl: z.string().url('유효한 이미지 URL이어야 합니다'),
  hasAvailableSchedules: z.boolean(),
});

export const ConcertListResponseSchema = z.object({
  concerts: z.array(ConcertItemSchema),
  total: z.number().min(0),
});

// 콘서트 예매 가능 여부 확인 스키마
export const ConcertAvailabilityParamsSchema = z.object({
  concertId: z.string().uuid('유효한 콘서트 ID가 필요합니다'),
});

export const ConcertAvailabilityResponseSchema = z.object({
  available: z.boolean(),
  availableSchedules: z.number().min(0),
  reason: z.string().optional(),
});

// 데이터베이스 테이블 스키마
export const ConcertTableRowSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable(),
  poster_image_url: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export const ScheduleTableRowSchema = z.object({
  id: z.string().uuid(),
  concert_id: z.string().uuid(),
  date_time: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

// 타입 추론
export type ConcertItem = z.infer<typeof ConcertItemSchema>;
export type ConcertListResponse = z.infer<typeof ConcertListResponseSchema>;
export type ConcertAvailabilityParams = z.infer<typeof ConcertAvailabilityParamsSchema>;
export type ConcertAvailabilityResponse = z.infer<typeof ConcertAvailabilityResponseSchema>;
export type ConcertTableRow = z.infer<typeof ConcertTableRowSchema>;
export type ScheduleTableRow = z.infer<typeof ScheduleTableRowSchema>;
