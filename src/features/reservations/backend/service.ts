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
        schedules (
          date_time,
          concerts (
            title
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
      date_time: string;
      concerts: { title: string };
    };

    return success({
      reservationId: data.id,
      reservationNumber: data.reservation_number,
      customerName: data.customer_name,
      customerPhone: data.customer_phone,
      customerEmail: data.customer_email,
      totalPrice: data.total_price,
      seatCount: data.seat_ids.length,
      concertTitle: schedules.concerts.title,
      scheduleDateTime: schedules.date_time,
      seatNumbers: seats?.map((s) => s.seat_number) || [],
      seats:
        seats?.map((s) => ({
          seatNumber: s.seat_number,
          grade: s.grade,
          price: s.price,
        })) || [],
      status: data.status,
      createdAt: data.created_at,
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
