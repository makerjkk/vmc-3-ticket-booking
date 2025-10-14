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
  ScheduleListRequestSchema,
  ScheduleDetailRequestSchema,
} from './schema';
import {
  getSchedulesByDate,
  getSeatLayout,
  getSeatCount,
  validateScheduleAvailability,
} from './service';
import {
  scheduleErrorCodes,
  getScheduleErrorHttpStatus,
  type ScheduleServiceError,
} from './error';

export const registerScheduleRoutes = (app: Hono<AppEnv>) => {
  // 특정 날짜의 회차 목록 조회
  app.get('/api/concerts/:concertId/schedules', async (c) => {
    const concertId = c.req.param('concertId');
    const date = c.req.query('date');

    // 요청 파라미터 검증
    const parsedParams = ScheduleListRequestSchema.safeParse({
      concertId,
      date,
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 요청 파라미터입니다',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`회차 목록 조회 요청: concertId=${parsedParams.data.concertId}, date=${parsedParams.data.date}`);

    const result = await getSchedulesByDate(
      supabase,
      parsedParams.data.concertId,
      parsedParams.data.date,
    );

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`회차 목록 조회 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`회차 목록 조회 성공: ${result.data.total}개 회차`);
    return respond(c, result);
  });

  // 특정 회차의 좌석 배치도 조회
  app.get('/api/schedules/:scheduleId/seats', async (c) => {
    const parsedParams = ScheduleDetailRequestSchema.safeParse({
      scheduleId: c.req.param('scheduleId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 회차 ID입니다',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`좌석 배치도 조회 요청: scheduleId=${parsedParams.data.scheduleId}`);

    const result = await getSeatLayout(supabase, parsedParams.data.scheduleId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`좌석 배치도 조회 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`좌석 배치도 조회 성공: ${result.data.totalSeats}개 좌석`);
    return respond(c, result);
  });

  // 실시간 좌석 수 조회
  app.get('/api/schedules/:scheduleId/seats/count', async (c) => {
    const parsedParams = ScheduleDetailRequestSchema.safeParse({
      scheduleId: c.req.param('scheduleId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 회차 ID입니다',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`실시간 좌석 수 조회 요청: scheduleId=${parsedParams.data.scheduleId}`);

    const result = await getSeatCount(supabase, parsedParams.data.scheduleId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`실시간 좌석 수 조회 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`실시간 좌석 수 조회 성공: ${result.data.availableSeats}/${result.data.totalSeats}`);
    
    // 캐시 헤더 설정 (60초)
    c.header('Cache-Control', 'max-age=60');
    
    return respond(c, result);
  });

  // 회차 예매 가능 여부 확인
  app.get('/api/schedules/:scheduleId/availability', async (c) => {
    const parsedParams = ScheduleDetailRequestSchema.safeParse({
      scheduleId: c.req.param('scheduleId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 회차 ID입니다',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`회차 예매 가능 여부 확인 요청: scheduleId=${parsedParams.data.scheduleId}`);

    const result = await validateScheduleAvailability(supabase, parsedParams.data.scheduleId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`회차 예매 가능 여부 확인 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`회차 예매 가능 여부 확인 성공: available=${result.data.available}`);
    return respond(c, result);
  });
};
