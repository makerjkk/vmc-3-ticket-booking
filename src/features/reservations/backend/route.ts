import type { Hono } from 'hono';
import {
  failure,
  success,
  respond,
  type ErrorResult,
} from '@/backend/http/response';
import {
  getLogger,
  getSupabase,
  type AppEnv,
} from '@/backend/hono/context';
import {
  ValidateSeatsRequestSchema,
  CreateReservationRequestSchema,
  SearchReservationsRequestSchema,
} from './schema';
import {
  validateSeats,
  createReservation,
  getReservationDetail,
  cancelReservation,
  searchReservations,
} from './service';
import {
  reservationErrorCodes,
  getReservationErrorHttpStatus,
  type ReservationServiceError,
} from './error';

export const registerReservationRoutes = (app: Hono<AppEnv>) => {
  // 좌석 유효성 검증
  app.post('/api/booking/validate-seats', async (c) => {
    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(400, reservationErrorCodes.invalidJson, '유효하지 않은 JSON 형식입니다')
      );
    }

    const parsedBody = ValidateSeatsRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          reservationErrorCodes.validationError,
          '유효하지 않은 요청 데이터입니다',
          parsedBody.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const { scheduleId, seatIds } = parsedBody.data;

    logger.info(
      `좌석 유효성 검증 요청: scheduleId=${scheduleId}, seatIds=${seatIds.join(',')}`
    );

    const result = await validateSeats(supabase, scheduleId, seatIds);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;
      logger.error(`좌석 유효성 검증 실패: ${errorResult.error.code}`, errorResult.error.message);
    } else {
      logger.info(`좌석 유효성 검증 성공: valid=${result.data.valid}`);
    }

    return respond(c, result);
  });

  // 예약 존재 여부 확인 (전화번호 기반)
  app.get('/api/booking/check-duplicate', async (c) => {
    const scheduleId = c.req.query('scheduleId');
    const customerPhone = c.req.query('customerPhone');

    if (!scheduleId || !customerPhone) {
      return respond(
        c,
        failure(400, reservationErrorCodes.validationError, 'scheduleId와 customerPhone이 필요합니다')
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`예약 중복 확인: scheduleId=${scheduleId}, phone=${customerPhone}`);

    try {
      const { data: existingReservation, error } = await supabase
        .from('reservations')
        .select('id, reservation_number')
        .eq('schedule_id', scheduleId)
        .eq('customer_phone', customerPhone)
        .eq('status', 'confirmed')
        .maybeSingle();

      if (error) {
        logger.error('예약 중복 확인 오류:', error);
        return respond(
          c,
          failure(500, reservationErrorCodes.internalError, '예약 확인 중 오류가 발생했습니다')
        );
      }

      if (existingReservation) {
        logger.info(`중복 예약 발견: reservationNumber=${existingReservation.reservation_number}`);
        return respond(
          c,
          success({
            isDuplicate: true,
            reservationNumber: existingReservation.reservation_number,
            message: '이미 해당 공연에 대한 예약이 존재합니다',
          })
        );
      }

      logger.info('중복 예약 없음');
      return respond(c, success({ isDuplicate: false }));
    } catch (error) {
      logger.error('예약 중복 확인 예외:', error);
      return respond(
        c,
        failure(500, reservationErrorCodes.internalError, '서버 내부 오류가 발생했습니다')
      );
    }
  });

  // 예약 생성
  app.post('/api/booking/reserve', async (c) => {
    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(400, reservationErrorCodes.invalidJson, '유효하지 않은 JSON 형식입니다')
      );
    }

    const parsedBody = CreateReservationRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          reservationErrorCodes.validationError,
          '유효하지 않은 요청 데이터입니다',
          parsedBody.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const request = parsedBody.data;

    logger.info(
      `예약 생성 요청: scheduleId=${request.scheduleId}, customer=${request.customerName}`
    );

    const result = await createReservation(supabase, request);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;
      logger.error(`예약 생성 실패: ${errorResult.error.code}`, errorResult.error.message);
    } else {
      logger.info(`예약 생성 성공: reservationId=${result.data.reservationId}`);
    }

    return respond(c, result);
  });

  // 예약 검색 (먼저 등록해야 :reservationId와 충돌하지 않음)
  app.get('/api/reservations/search', async (c) => {
    const query = c.req.query();
    
    const parsedQuery = SearchReservationsRequestSchema.safeParse({
      reservationId: query.reservationId,
      phone: query.phone,
      email: query.email,
      page: query.page ? parseInt(query.page) : 1,
      pageSize: query.pageSize ? parseInt(query.pageSize) : 10,
    });

    if (!parsedQuery.success) {
      return respond(
        c,
        failure(
          400,
          reservationErrorCodes.validationError,
          '유효하지 않은 검색 조건입니다',
          parsedQuery.error.format()
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`예약 검색 요청: ${JSON.stringify(parsedQuery.data)}`);

    const result = await searchReservations(supabase, parsedQuery.data);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;
      logger.error(`예약 검색 실패: ${errorResult.error.code}`, errorResult.error.message);
    } else {
      logger.info(`예약 검색 성공: ${result.data.totalCount}건`);
    }

    return respond(c, result);
  });

  // 예약 상세 조회
  app.get('/api/reservations/:reservationId', async (c) => {
    const reservationId = c.req.param('reservationId');

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`예약 상세 조회 요청: reservationId=${reservationId}`);

    const result = await getReservationDetail(supabase, reservationId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;
      logger.error(`예약 상세 조회 실패: ${errorResult.error.code}`, errorResult.error.message);
    } else {
      logger.info(`예약 상세 조회 성공: ${result.data.concert.title}`);
    }

    return respond(c, result);
  });

  // 예약 취소
  app.delete('/api/reservations/:reservationId', async (c) => {
    const reservationId = c.req.param('reservationId');

    // UUID 형식 검증
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(reservationId)) {
      return respond(
        c,
        failure(
          400,
          reservationErrorCodes.validationError,
          '유효하지 않은 예약 ID 형식입니다'
        )
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`예약 취소 요청: reservationId=${reservationId}`);

    const result = await cancelReservation(supabase, reservationId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ReservationServiceError, unknown>;
      logger.error(`예약 취소 실패: ${errorResult.error.code}`, errorResult.error.message);
    } else {
      logger.info(`예약 취소 성공: ${result.data.reservationNumber}`);
    }

    return respond(c, result);
  });
};
