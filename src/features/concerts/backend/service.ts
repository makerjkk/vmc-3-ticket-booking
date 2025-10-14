import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  ConcertListResponseSchema,
  ConcertAvailabilityResponseSchema,
  ConcertTableRowSchema,
  type ConcertListResponse,
  type ConcertAvailabilityResponse,
  type ConcertTableRow,
} from './schema';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from './error';

const CONCERTS_TABLE = 'concerts';
const SCHEDULES_TABLE = 'schedules';

// 기본 포스터 이미지 생성 함수
const generatePosterImageUrl = (concertId: string, title: string) => {
  const seed = encodeURIComponent(`${concertId}-${title}`);
  return `https://picsum.photos/seed/${seed}/400/600`;
};

/**
 * 예매 가능한 콘서트 목록 조회
 */
export const getConcertList = async (
  client: SupabaseClient,
): Promise<HandlerResult<ConcertListResponse, string, unknown>> => {
  try {
    // 예매 가능한 콘서트만 조회 (미래 일정이 있는 콘서트)
    const { data: concertsData, error: concertsError } = await client
      .from(CONCERTS_TABLE)
      .select(`
        id,
        title,
        description,
        poster_image_url,
        created_at,
        updated_at,
        ${SCHEDULES_TABLE}!inner(
          id,
          date_time
        )
      `)
      .gt(`${SCHEDULES_TABLE}.date_time`, new Date().toISOString())
      .order('created_at', { ascending: false });

    if (concertsError) {
      return failure(
        500,
        concertErrorCodes.fetchError,
        `콘서트 목록 조회 실패: ${concertsError.message}`,
      );
    }

    if (!concertsData) {
      return success({
        concerts: [],
        total: 0,
      });
    }

    // 중복 제거 및 데이터 변환
    const uniqueConcerts = new Map<string, ConcertTableRow>();
    
    for (const item of concertsData) {
      const concert = {
        id: item.id,
        title: item.title,
        description: item.description,
        poster_image_url: item.poster_image_url,
        created_at: item.created_at,
        updated_at: item.updated_at,
      };

      // 스키마 검증
      const rowParse = ConcertTableRowSchema.safeParse(concert);
      if (!rowParse.success) {
        continue; // 유효하지 않은 데이터는 건너뛰기
      }

      uniqueConcerts.set(item.id, rowParse.data);
    }

    // 응답 데이터 구성
    const concerts = Array.from(uniqueConcerts.values()).map((concert) => ({
      id: concert.id,
      title: concert.title,
      posterImageUrl: concert.poster_image_url || generatePosterImageUrl(concert.id, concert.title),
      hasAvailableSchedules: true, // 이미 미래 일정이 있는 콘서트만 조회했으므로 true
    }));

    const response = {
      concerts,
      total: concerts.length,
    };

    // 응답 스키마 검증
    const parsed = ConcertListResponseSchema.safeParse(response);
    if (!parsed.success) {
      return failure(
        500,
        concertErrorCodes.validationError,
        '콘서트 목록 응답 검증 실패',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    return failure(
      500,
      concertErrorCodes.databaseError,
      `데이터베이스 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 특정 콘서트의 예매 가능 여부 확인
 */
export const checkConcertAvailability = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<ConcertAvailabilityResponse, string, unknown>> => {
  try {
    // 콘서트 존재 여부 확인
    const { data: concertData, error: concertError } = await client
      .from(CONCERTS_TABLE)
      .select('id, title')
      .eq('id', concertId)
      .maybeSingle();

    if (concertError) {
      return failure(
        500,
        concertErrorCodes.availabilityCheckError,
        `콘서트 조회 실패: ${concertError.message}`,
      );
    }

    if (!concertData) {
      return failure(
        404,
        concertErrorCodes.notFound,
        '콘서트를 찾을 수 없습니다',
      );
    }

    // 예매 가능한 일정 수 조회
    const { data: schedulesData, error: schedulesError } = await client
      .from(SCHEDULES_TABLE)
      .select('id')
      .eq('concert_id', concertId)
      .gt('date_time', new Date().toISOString());

    if (schedulesError) {
      return failure(
        500,
        concertErrorCodes.availabilityCheckError,
        `일정 조회 실패: ${schedulesError.message}`,
      );
    }

    const availableSchedules = schedulesData?.length || 0;
    const available = availableSchedules > 0;

    const response = {
      available,
      availableSchedules,
      reason: available ? undefined : '예매 가능한 일정이 없습니다',
    };

    // 응답 스키마 검증
    const parsed = ConcertAvailabilityResponseSchema.safeParse(response);
    if (!parsed.success) {
      return failure(
        500,
        concertErrorCodes.validationError,
        '예매 가능 여부 응답 검증 실패',
        parsed.error.format(),
      );
    }

    return success(parsed.data);
  } catch (error) {
    return failure(
      500,
      concertErrorCodes.databaseError,
      `데이터베이스 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};
