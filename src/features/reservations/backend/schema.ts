import { z } from 'zod';

// 좌석 검증 요청 스키마
export const ValidateSeatsRequestSchema = z.object({
  scheduleId: z.string().uuid('유효한 회차 ID가 필요합니다'),
  seatIds: z
    .array(z.string().uuid())
    .min(1, '최소 1개의 좌석을 선택해야 합니다')
    .max(4, '최대 4개의 좌석까지 선택할 수 있습니다'),
});

// 좌석 검증 응답 스키마
export const ValidateSeatsResponseSchema = z.object({
  valid: z.boolean(),
  invalidSeats: z.array(z.string().uuid()).optional(),
  message: z.string().optional(),
});

// 예약 생성 요청 스키마
export const CreateReservationRequestSchema = z.object({
  scheduleId: z.string().uuid('유효한 회차 ID가 필요합니다'),
  seatIds: z.array(z.string().uuid()).min(1).max(4),
  customerName: z
    .string()
    .min(2, '이름은 최소 2자 이상이어야 합니다')
    .max(50, '이름은 최대 50자까지 입력 가능합니다'),
  customerPhone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-1234-5678 형식이어야 합니다'),
  customerEmail: z
    .string()
    .email('올바른 이메일 형식이 아닙니다')
    .optional()
    .or(z.literal('')),
  totalPrice: z.number().min(0),
});

// 예약 생성 응답 스키마
export const CreateReservationResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  customerName: z.string(),
  totalPrice: z.number(),
  seatCount: z.number(),
  concertTitle: z.string(),
  scheduleDateTime: z.string(),
  seatNumbers: z.array(z.string()),
  createdAt: z.string(),
});

// 예약 상세 응답 스키마 (예약 완료 페이지용)
export const ReservationDetailResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  customerName: z.string(),
  customerPhone: z.string(),
  customerEmail: z.string().nullable(),
  status: z.enum(['confirmed', 'cancelled']),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
  scheduleDateTime: z.string(), // 프론트엔드 호환성을 위해 추가
  concert: z.object({
    id: z.string().uuid(),
    title: z.string(),
    posterImageUrl: z.string().nullable(), // nullable로 수정
  }),
  schedule: z.object({
    id: z.string().uuid(),
    dateTime: z.string(),
  }),
  seats: z.array(
    z.object({
      seatNumber: z.string(),
      grade: z.string(),
      price: z.number(),
    })
  ),
  seatCount: z.number(),
  totalPrice: z.number(),
});

// 예약 취소 응답 스키마
export const CancelReservationResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  status: z.literal('cancelled'),
  cancelledAt: z.string(),
  message: z.string().optional(),
});

// 예약 검색 요청 스키마
export const SearchReservationsRequestSchema = z.object({
  // reservationId는 UUID(id) 또는 예약번호(reservation_number: R + 10자리 숫자) 모두 허용
  reservationId: z.string().refine(
    (val) => {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const reservationNumberRegex = /^R\d{10}$/;
      return uuidRegex.test(val) || reservationNumberRegex.test(val);
    },
    { message: '올바른 예약 번호 형식이 아닙니다 (예: R2510150002)' }
  ).optional(),
  phone: z.string().regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-1234-5678 형식이어야 합니다').optional(),
  email: z.string().email('올바른 이메일 형식이 아닙니다').optional(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(100).default(10),
}).refine(
  (data) => data.reservationId || data.phone || data.email,
  { message: '예약 번호 또는 연락처를 입력해주세요' }
);

// 예약 검색 응답 아이템 스키마
export const ReservationSearchItemSchema = z.object({
  id: z.string().uuid(),
  reservationNumber: z.string(),
  concertTitle: z.string(),
  scheduleDateTime: z.string(),
  customerName: z.string(),
  totalPrice: z.number(),
  seatCount: z.number(),
  seats: z.array(
    z.object({
      seatNumber: z.string(),
      grade: z.string(),
      price: z.number(),
    })
  ),
  status: z.enum(['confirmed', 'cancelled']),
  createdAt: z.string(),
  cancelledAt: z.string().nullable(),
});

// 예약 검색 응답 스키마
export const SearchReservationsResponseSchema = z.object({
  reservations: z.array(ReservationSearchItemSchema),
  totalCount: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
});

// 타입 추론
export type ValidateSeatsRequest = z.infer<typeof ValidateSeatsRequestSchema>;
export type ValidateSeatsResponse = z.infer<typeof ValidateSeatsResponseSchema>;
export type CreateReservationRequest = z.infer<typeof CreateReservationRequestSchema>;
export type CreateReservationResponse = z.infer<typeof CreateReservationResponseSchema>;
export type ReservationDetailResponse = z.infer<typeof ReservationDetailResponseSchema>;
export type CancelReservationResponse = z.infer<typeof CancelReservationResponseSchema>;
export type SearchReservationsRequest = z.infer<typeof SearchReservationsRequestSchema>;
export type ReservationSearchItem = z.infer<typeof ReservationSearchItemSchema>;
export type SearchReservationsResponse = z.infer<typeof SearchReservationsResponseSchema>;
