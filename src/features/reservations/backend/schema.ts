import { z } from 'zod';

// 고객 정보 스키마
export const CustomerInfoSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름에는 한글, 영문, 공백만 사용할 수 있습니다'),
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-XXXX-XXXX 형식으로 입력해주세요'),
  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요')
    .optional()
    .nullable(),
});

// 예약 생성 요청 스키마
export const CreateReservationRequestSchema = z.object({
  concertId: z.string().uuid('유효하지 않은 콘서트 ID입니다'),
  scheduleId: z.string().uuid('유효하지 않은 스케줄 ID입니다'),
  seatIds: z
    .array(z.string().uuid('유효하지 않은 좌석 ID입니다'))
    .min(1, '최소 1개의 좌석을 선택해야 합니다')
    .max(4, '최대 4개의 좌석까지 선택할 수 있습니다'),
  customerInfo: CustomerInfoSchema,
});

// 예약 생성 응답 스키마
export const CreateReservationResponseSchema = z.object({
  reservationId: z.string().uuid(),
  reservationNumber: z.string(),
  status: z.enum(['confirmed', 'pending', 'cancelled']),
  totalPrice: z.number().min(0),
  createdAt: z.string().datetime(),
  customerInfo: CustomerInfoSchema,
  seats: z.array(z.object({
    id: z.string().uuid(),
    seatNumber: z.string(),
    rowName: z.string(),
    seatIndex: z.number(),
    grade: z.enum(['R', 'S', 'A']),
    price: z.number().min(0),
  })),
  concert: z.object({
    id: z.string().uuid(),
    title: z.string(),
    venue: z.string(),
  }),
  schedule: z.object({
    id: z.string().uuid(),
    date: z.string(),
    time: z.string(),
  }),
});

// 좌석 요약 요청 스키마
export const SeatSummaryRequestSchema = z.object({
  seatIds: z
    .array(z.string().uuid('유효하지 않은 좌석 ID입니다'))
    .min(1, '최소 1개의 좌석을 선택해야 합니다')
    .max(4, '최대 4개의 좌석까지 선택할 수 있습니다'),
});

// 좌석 요약 응답 스키마
export const SeatSummaryResponseSchema = z.object({
  seats: z.array(z.object({
    id: z.string().uuid(),
    seatNumber: z.string(),
    rowName: z.string(),
    seatIndex: z.number(),
    grade: z.enum(['R', 'S', 'A']),
    price: z.number().min(0),
    status: z.enum(['available', 'reserved', 'maintenance']),
  })),
  totalPrice: z.number().min(0),
  availableCount: z.number().min(0),
});

// 콘서트 스케줄 정보 응답 스키마
export const ConcertScheduleResponseSchema = z.object({
  concert: z.object({
    id: z.string().uuid(),
    title: z.string(),
    venue: z.string(),
    description: z.string().optional(),
    imageUrl: z.string().url().optional(),
  }),
  schedule: z.object({
    id: z.string().uuid(),
    date: z.string(),
    time: z.string(),
    availableSeats: z.number().min(0),
    totalSeats: z.number().min(0),
  }),
});

// 타입 export
export type CustomerInfo = z.infer<typeof CustomerInfoSchema>;
export type CreateReservationRequest = z.infer<typeof CreateReservationRequestSchema>;
export type CreateReservationResponse = z.infer<typeof CreateReservationResponseSchema>;
export type SeatSummaryRequest = z.infer<typeof SeatSummaryRequestSchema>;
export type SeatSummaryResponse = z.infer<typeof SeatSummaryResponseSchema>;
export type ConcertScheduleResponse = z.infer<typeof ConcertScheduleResponseSchema>;
