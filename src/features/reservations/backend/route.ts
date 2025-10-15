import type { Hono } from 'hono';
import {
  failure,
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
} from './schema';
import {
  validateSeats,
  createReservation,
  getReservationDetail,
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
      logger.info(`예약 상세 조회 성공: ${result.data.concertTitle}`);
    }

    return respond(c, result);
  });
};
