// Backend 스키마를 클라이언트에서 재사용하기 위한 DTO 재노출
export {
  ConcertItemSchema,
  ConcertListResponseSchema,
  ConcertAvailabilityResponseSchema,
  type ConcertItem,
  type ConcertListResponse,
  type ConcertAvailabilityResponse,
} from '@/features/concerts/backend/schema';
