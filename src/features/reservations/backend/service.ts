import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  reservationErrorCodes,
  type ReservationServiceError,
} from './error';
import type {
  CreateReservationRequest,
  ReservationDetailResponse,
  CancelReservationResponse,
  SearchReservationsRequest,
  SearchReservationsResponse,
} from './schema';

// 테이블 이름 상수
const RESERVATIONS_TABLE = 'reservations';
const SEATS_TABLE = 'seats';
const SCHEDULES_TABLE = 'schedules';
const CONCERTS_TABLE = 'concerts';

/**
 * 좌석 유효성 검증
 */
export const validateSeats = async (
  client: SupabaseClient,
  scheduleId: string,
  seatIds: string[]
): Promise<
  HandlerResult<
    { valid: boolean; invalidSeats?: string[] },
    ReservationServiceError,
    unknown
  >
> => {
  try {
    // 좌석 상태 확인
    const { data: seats, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('id, status')
      .eq('schedule_id', scheduleId)
      .in('id', seatIds);

    if (seatsError) {
      console.error('Seat validation error:', seatsError);
      return failure(
        500,
        reservationErrorCodes.seatValidationError,
        '좌석 검증 중 오류가 발생했습니다'
      );
    }

    // 모든 좌석이 존재하고 available 상태인지 확인
    const invalidSeats = seatIds.filter((seatId) => {
      const seat = seats?.find((s) => s.id === seatId);
      return !seat || seat.status !== 'available';
    });

    if (invalidSeats.length > 0) {
      return success({
        valid: false,
        invalidSeats,
      });
    }

    return success({ valid: true });
  } catch (error) {
    console.error('Seat validation exception:', error);
    return failure(
      500,
      reservationErrorCodes.internalError,
      '서버 내부 오류가 발생했습니다'
    );
  }
};

/**
 * 예약 생성 (트랜잭션)
 */
export const createReservation = async (
  client: SupabaseClient,
  request: CreateReservationRequest
): Promise<
  HandlerResult<
    { reservationId: string; reservationNumber: string },
    ReservationServiceError,
    unknown
  >
> => {
  try {
    // 1. 중복 예약 확인
    const { data: existingReservation, error: checkError } = await client
      .from(RESERVATIONS_TABLE)
      .select('id')
      .eq('schedule_id', request.scheduleId)
      .eq('customer_phone', request.customerPhone)
      .eq('status', 'confirmed')
      .maybeSingle();

    if (checkError) {
      console.error('Duplicate check error:', checkError);
      return failure(
        500,
        reservationErrorCodes.duplicateCheckError,
        '중복 예약 확인 중 오류가 발생했습니다'
      );
    }

    if (existingReservation) {
      return failure(
        409,
        reservationErrorCodes.duplicateReservation,
        '이미 해당 공연에 대한 예약이 존재합니다'
      );
    }

    // 2. 트랜잭션 시작 (RPC 함수 사용)
    const { data: result, error: reservationError } = await client.rpc(
      'create_reservation_with_seats',
      {
        p_schedule_id: request.scheduleId,
        p_seat_ids: request.seatIds,
        p_customer_name: request.customerName,
        p_customer_phone: request.customerPhone,
        p_customer_email: request.customerEmail || '',
        p_total_price: request.totalPrice,
      }
    );

    if (reservationError) {
      console.error('Reservation creation error:', reservationError);

      // 동시성 충돌 처리
      if (
        reservationError.message &&
        reservationError.message.includes('SEATS_NOT_AVAILABLE')
      ) {
        return failure(
          409,
          reservationErrorCodes.seatsNotAvailable,
          '선택하신 좌석이 이미 예약되었습니다'
        );
      }

      return failure(
        500,
        reservationErrorCodes.reservationCreationError,
        '예약 생성 중 오류가 발생했습니다'
      );
    }

    return success({
      reservationId: result.reservation_id,
      reservationNumber: result.reservation_number,
    });
  } catch (error) {
    console.error('Reservation creation exception:', error);
    return failure(
      500,
      reservationErrorCodes.internalError,
      '서버 내부 오류가 발생했습니다'
    );
  }
};

/**
 * 예약 상세 조회 (완료 페이지용)
 */
export const getReservationDetail = async (
  client: SupabaseClient,
  reservationId: string
): Promise<
  HandlerResult<ReservationDetailResponse, ReservationServiceError, unknown>
> => {
  try {
    const { data, error } = await client
      .from(RESERVATIONS_TABLE)
      .select(
        `
        id,
        reservation_number,
        schedule_id,
        seat_ids,
        total_price,
        customer_name,
        customer_phone,
        customer_email,
        status,
        created_at,
        cancelled_at,
        schedules (
          id,
          date_time,
          concerts (
            id,
            title,
            poster_image_url
          )
        )
      `
      )
      .eq('id', reservationId)
      .single();

    if (error || !data) {
      console.error('Reservation fetch error:', error);
      return failure(
        404,
        reservationErrorCodes.reservationNotFound,
        '예약을 찾을 수 없습니다'
      );
    }

    // 좌석 정보 조회
    const { data: seats, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('seat_number, grade, price')
      .in('id', data.seat_ids);

    if (seatsError) {
      console.error('Seat fetch error:', seatsError);
      return failure(
        500,
        reservationErrorCodes.seatFetchError,
        '좌석 정보 조회 중 오류가 발생했습니다'
      );
    }

    // 타입 안전성을 위한 체크
    const schedules = data.schedules as unknown as {
      id: string;
      date_time: string;
      concerts: { id: string; title: string; poster_image_url: string };
    };

    return success({
      reservationId: data.id,
      reservationNumber: data.reservation_number,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerEmail: data.customer_email,
      status: data.status,
      createdAt: data.created_at,
      cancelledAt: data.cancelled_at,
      scheduleDateTime: schedules.date_time, // 프론트엔드 호환성을 위해 추가
      concert: {
        id: schedules.concerts.id,
        title: schedules.concerts.title,
        posterImageUrl: schedules.concerts.poster_image_url || null, // null 처리
      },
      schedule: {
        id: schedules.id,
        dateTime: schedules.date_time,
      },
      seats:
        seats?.map((s) => ({
          seatNumber: s.seat_number,
          grade: s.grade,
          price: s.price,
        })) || [],
      seatCount: data.seat_ids.length,
      totalPrice: data.total_price,
    });
  } catch (error) {
    console.error('Reservation detail fetch exception:', error);
    return failure(
      500,
      reservationErrorCodes.internalError,
      '서버 내부 오류가 발생했습니다'
    );
  }
};

/**
 * 예약 취소
 */
export const cancelReservation = async (
  client: SupabaseClient,
  reservationId: string
): Promise<
  HandlerResult<CancelReservationResponse, ReservationServiceError, unknown>
> => {
  try {
    // RPC 함수 호출 (트랜잭션 기반)
    const { data: result, error: rpcError } = await client.rpc(
      'cancel_reservation_rpc',
      {
        p_reservation_id: reservationId,
      }
    );

    if (rpcError) {
      console.error('Reservation cancellation error:', rpcError);

      // 에러 메시지 파싱
      if (rpcError.message?.includes('RESERVATION_NOT_FOUND')) {
        return failure(
          404,
          reservationErrorCodes.reservationNotFound,
          '예약을 찾을 수 없습니다'
        );
      }

      if (rpcError.message?.includes('ALREADY_CANCELLED')) {
        return failure(
          400,
          reservationErrorCodes.alreadyCancelled,
          '이미 취소된 예약입니다'
        );
      }

      if (rpcError.message?.includes('CANNOT_CANCEL_TOO_CLOSE')) {
        return failure(
          400,
          reservationErrorCodes.cannotCancelTooClose,
          '공연 시작 2시간 전까지만 취소할 수 있습니다'
        );
      }

      return failure(
        500,
        reservationErrorCodes.cancellationFailed,
        '예약 취소 중 오류가 발생했습니다'
      );
    }

    // 취소된 예약 정보 재조회
    const { data: reservation, error: fetchError } = await client
      .from(RESERVATIONS_TABLE)
      .select('id, reservation_number, status, cancelled_at')
      .eq('id', reservationId)
      .single();

    if (fetchError || !reservation) {
      console.error('Fetch cancelled reservation error:', fetchError);
      return failure(
        500,
        reservationErrorCodes.internalError,
        '취소된 예약 정보 조회 중 오류가 발생했습니다'
      );
    }

    return success({
      reservationId: reservation.id,
      reservationNumber: reservation.reservation_number,
      status: 'cancelled' as const,
      cancelledAt: reservation.cancelled_at,
    });
  } catch (error) {
    console.error('Reservation cancellation exception:', error);
    return failure(
      500,
      reservationErrorCodes.internalError,
      '서버 내부 오류가 발생했습니다'
    );
  }
};

/**
 * 예약 검색
 */
export const searchReservations = async (
  client: SupabaseClient,
  request: SearchReservationsRequest
): Promise<
  HandlerResult<SearchReservationsResponse, ReservationServiceError, unknown>
> => {
  try {
    let query = client
      .from(RESERVATIONS_TABLE)
      .select(
        `
        id,
        reservation_number,
        schedule_id,
        seat_ids,
        total_price,
        customer_name,
        customer_phone,
        customer_email,
        status,
        created_at,
        cancelled_at,
        schedules (
          date_time,
          concerts (
            title
          )
        )
      `,
        { count: 'exact' }
      );

    if (request.reservationId) {
      // UUID 형식인지 예약번호 형식인지 구분
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(request.reservationId)) {
        // UUID로 검색 (id 컬럼)
        query = query.eq('id', request.reservationId);
      } else {
        // 예약번호로 검색 (reservation_number 컬럼)
        query = query.eq('reservation_number', request.reservationId);
      }
    } else if (request.phone) {
      query = query.eq('customer_phone', request.phone);
    } else if (request.email) {
      query = query.ilike('customer_email', request.email);
    }

    const from = (request.page - 1) * request.pageSize;
    const to = from + request.pageSize - 1;
    
    query = query
      .order('created_at', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Reservation search error:', error);
      return failure(
        500,
        reservationErrorCodes.searchError,
        '예약 검색 중 오류가 발생했습니다'
      );
    }

    if (!data || data.length === 0) {
      return success({
        reservations: [],
        totalCount: 0,
        page: request.page,
        pageSize: request.pageSize,
        totalPages: 0,
      });
    }

    const allSeatIds = data.flatMap(r => r.seat_ids);
    const { data: seats, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('id, seat_number, grade, price')
      .in('id', allSeatIds);

    if (seatsError) {
      console.error('Seat fetch error:', seatsError);
      return failure(
        500,
        reservationErrorCodes.seatFetchError,
        '좌석 정보 조회 중 오류가 발생했습니다'
      );
    }

    const reservations = data.map(r => {
      const schedules = r.schedules as unknown as {
        date_time: string;
        concerts: { title: string };
      };
      
      const reservationSeats = seats?.filter(s => r.seat_ids.includes(s.id)) || [];

      return {
        id: r.id,
        reservationNumber: r.reservation_number,
        concertTitle: schedules.concerts.title,
        scheduleDateTime: schedules.date_time,
        customerName: r.customer_name,
        totalPrice: r.total_price,
        seatCount: r.seat_ids.length,
        seats: reservationSeats.map(s => ({
          seatNumber: s.seat_number,
          grade: s.grade,
          price: s.price,
        })),
        status: r.status,
        createdAt: r.created_at,
        cancelledAt: r.cancelled_at,
      };
    });

    const totalPages = Math.ceil((count || 0) / request.pageSize);

    return success({
      reservations,
      totalCount: count || 0,
      page: request.page,
      pageSize: request.pageSize,
      totalPages,
    });
  } catch (error) {
    console.error('Reservation search exception:', error);
    return failure(
      500,
      reservationErrorCodes.internalError,
      '서버 내부 오류가 발생했습니다'
    );
  }
};
