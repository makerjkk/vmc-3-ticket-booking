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
  SeatHoldRequestSchema,
} from './schema';
import {
  getConcertInfo,
  getAvailableDates,
  getSchedulesByDate,
  getSeatLayout,
  getSeatCount,
  validateScheduleAvailability,
  getSeatStatusUpdate,
  holdSeats,
  releaseSeats,
  detectSeatConflicts,
  cleanupExpiredHolds,
} from './service';
import {
  scheduleErrorCodes,
  getScheduleErrorHttpStatus,
  type ScheduleServiceError,
} from './error';

export const registerScheduleRoutes = (app: Hono<AppEnv>) => {
  // 콘서트 기본 정보 조회
  app.get('/api/concerts/:concertId', async (c) => {
    const concertId = c.req.param('concertId');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('콘서트 정보 조회 요청', { concertId });

    try {
      const result = await getConcertInfo(supabase, concertId);

      if (!result.ok) {
        const errorCode = (('code' in result && result.code) || 'UNKNOWN_ERROR') as string;
        const errorMessage = (('message' in result && result.message) || '알 수 없는 오류가 발생했습니다') as string;
        const httpStatus = getScheduleErrorHttpStatus(errorCode as ScheduleServiceError) as import('hono/utils/http-status').ContentfulStatusCode;
        return respond(c, failure(httpStatus, errorCode, errorMessage));
      }

      return respond(c, result);
    } catch (error) {
      logger.error('콘서트 정보 조회 중 예외 발생', { error, concertId });
      return respond(c, failure(500, 'INTERNAL_ERROR', '서버 내부 오류가 발생했습니다'));
    }
  });

  // 예매 가능한 날짜 목록 조회
  app.get('/api/concerts/:concertId/available-dates', async (c) => {
    const concertId = c.req.param('concertId');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('예매 가능한 날짜 조회 요청', { concertId });

    try {
      const result = await getAvailableDates(supabase, concertId);

      if (!result.ok) {
        const errorCode = (('code' in result && result.code) || 'UNKNOWN_ERROR') as string;
        const errorMessage = (('message' in result && result.message) || '알 수 없는 오류가 발생했습니다') as string;
        const httpStatus = getScheduleErrorHttpStatus(errorCode as ScheduleServiceError) as import('hono/utils/http-status').ContentfulStatusCode;
        return respond(c, failure(httpStatus, errorCode, errorMessage));
      }

      return respond(c, result);
    } catch (error) {
      logger.error('예매 가능한 날짜 조회 중 예외 발생', { error, concertId });
      return respond(c, failure(500, 'INTERNAL_ERROR', '서버 내부 오류가 발생했습니다'));
    }
  });

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

  // 좌석 상태 업데이트 조회 (실시간 동기화용)
  app.get('/api/schedules/:scheduleId/seats/status', async (c) => {
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

    logger.info(`좌석 상태 업데이트 조회 요청: scheduleId=${parsedParams.data.scheduleId}`);

    const result = await getSeatStatusUpdate(supabase, parsedParams.data.scheduleId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`좌석 상태 업데이트 조회 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`좌석 상태 업데이트 조회 성공: ${result.data.seats.length}개 좌석`);
    
    // 짧은 캐시 헤더 설정 (10초)
    c.header('Cache-Control', 'max-age=10');
    
    return respond(c, result);
  });

  // 좌석 홀드 (임시 예약)
  app.post('/api/seats/hold', async (c) => {
    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 JSON 형식입니다',
        ),
      );
    }

    const parsedBody = SeatHoldRequestSchema.safeParse(requestBody);

    if (!parsedBody.success) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 요청 데이터입니다',
          parsedBody.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    const { scheduleId, seatIds, holdDuration } = parsedBody.data;

    logger.info(`좌석 홀드 요청: scheduleId=${scheduleId}, seatIds=${seatIds.join(',')}, duration=${holdDuration}`);

    const result = await holdSeats(supabase, scheduleId, seatIds, holdDuration);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`좌석 홀드 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`좌석 홀드 성공: holdId=${result.data.holdId}`);
    return respond(c, result);
  });

  // 좌석 홀드 해제
  app.delete('/api/seats/hold/:holdId', async (c) => {
    const holdId = c.req.param('holdId');

    if (!holdId) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '홀드 ID가 필요합니다',
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`좌석 홀드 해제 요청: holdId=${holdId}`);

    const result = await releaseSeats(supabase, holdId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`좌석 홀드 해제 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`좌석 홀드 해제 성공: holdId=${holdId}`);
    return respond(c, result);
  });

  // 좌석 충돌 감지
  app.post('/api/schedules/:scheduleId/seats/conflicts', async (c) => {
    const scheduleId = c.req.param('scheduleId');
    
    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '유효하지 않은 JSON 형식입니다',
        ),
      );
    }

    const { seatIds } = requestBody;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return respond(
        c,
        failure(
          400,
          scheduleErrorCodes.validationError,
          '좌석 ID 목록이 필요합니다',
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`좌석 충돌 감지 요청: scheduleId=${scheduleId}, seatIds=${seatIds.join(',')}`);

    const result = await detectSeatConflicts(supabase, scheduleId, seatIds);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`좌석 충돌 감지 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`좌석 충돌 감지 성공: conflicts=${result.data.conflictSeats.length}`);
    return respond(c, result);
  });

  // 만료된 홀드 정리 (관리자용)
  app.post('/api/admin/seats/cleanup', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('만료된 좌석 홀드 정리 요청');

    const result = await cleanupExpiredHolds(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<ScheduleServiceError, unknown>;
      
      logger.error(`만료된 홀드 정리 실패: ${errorResult.error.code}`, errorResult.error.message);
      
      return respond(c, result);
    }

    logger.info(`만료된 홀드 정리 성공: cleaned=${result.data.cleanedCount}`);
    return respond(c, result);
  });

  // 좌석 정보 요약 조회 (customer-info 페이지용)
  app.post('/api/schedules/:scheduleId/seats/summary', async (c) => {
    const scheduleId = c.req.param('scheduleId');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    let requestBody;
    try {
      requestBody = await c.req.json();
    } catch (error) {
      return respond(
        c,
        failure(400, 'INVALID_JSON', '유효하지 않은 JSON 형식입니다')
      );
    }

    const { seatIds } = requestBody;

    if (!Array.isArray(seatIds) || seatIds.length === 0) {
      return respond(
        c,
        failure(400, 'INVALID_REQUEST', '좌석 ID 목록이 필요합니다')
      );
    }

    logger.info('좌석 정보 요약 조회 요청', { scheduleId, seatCount: seatIds.length });

    try {
      const { data: seats, error } = await supabase
        .from('seats')
        .select('id, seat_number, grade, price, status, row_name, seat_index')
        .eq('schedule_id', scheduleId)
        .in('id', seatIds);

      if (error) {
        logger.error('좌석 정보 조회 실패', error);
        return respond(
          c,
          failure(500, 'DATABASE_ERROR', '좌석 정보를 조회할 수 없습니다')
        );
      }

      const totalPrice = seats?.reduce((sum, seat) => sum + seat.price, 0) || 0;

      logger.info('좌석 정보 요약 조회 성공', { seatCount: seats?.length });

      return c.json({
        seats: seats || [],
        totalPrice,
      });
    } catch (error) {
      logger.error('좌석 정보 요약 조회 예외', error);
      return respond(
        c,
        failure(500, 'INTERNAL_ERROR', '서버 내부 오류가 발생했습니다')
      );
    }
  });

  // 콘서트 스케줄 상세 조회 (customer-info 페이지용)
  app.get('/api/concerts/:concertId/schedule/:scheduleId', async (c) => {
    const concertId = c.req.param('concertId');
    const scheduleId = c.req.param('scheduleId');
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('콘서트 스케줄 상세 조회 요청', { concertId, scheduleId });

    try {
      // 먼저 스케줄만 조회해서 존재 여부 확인
      const { data: scheduleOnly, error: scheduleOnlyError } = await supabase
        .from('schedules')
        .select('id, concert_id, date_time')
        .eq('id', scheduleId)
        .maybeSingle();

      logger.info('스케줄 존재 확인', { exists: !!scheduleOnly, error: scheduleOnlyError });

      const { data: schedule, error: scheduleError } = await supabase
        .from('schedules')
        .select(`
          id,
          concert_id,
          date_time,
          concerts (
            id,
            title,
            description,
            venue_name,
            venue_address
          )
        `)
        .eq('id', scheduleId)
        .eq('concert_id', concertId)
        .single();

      if (scheduleError || !schedule) {
        logger.error('스케줄 정보 조회 실패', { error: scheduleError, schedule });
        return respond(
          c,
          failure(404, 'SCHEDULE_NOT_FOUND', '스케줄을 찾을 수 없습니다')
        );
      }

      const dateTime = new Date(schedule.date_time);
      const dateStr = dateTime.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
      });
      const timeStr = dateTime.toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });

      logger.info('콘서트 스케줄 상세 조회 성공');

      return c.json({
        concert: schedule.concerts,
        schedule: {
          id: schedule.id,
          date: dateStr,
          time: timeStr,
          dateTime: schedule.date_time,
        },
      });
    } catch (error) {
      logger.error('콘서트 스케줄 상세 조회 예외', error);
      return respond(
        c,
        failure(500, 'INTERNAL_ERROR', '서버 내부 오류가 발생했습니다')
      );
    }
  });
};
