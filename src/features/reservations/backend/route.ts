import { Hono } from 'hono';
import type { AppEnv } from '@/backend/hono/context';
import { success, failure, respond } from '@/backend/http/response';
import {
  CreateReservationRequestSchema,
  SeatSummaryRequestSchema,
} from './schema';
import {
  createReservation,
  getSeatSummary,
  getConcertSchedule,
} from './service';

const reservationRoutes = new Hono<AppEnv>();

/**
 * POST /api/reservations
 * 새로운 예약을 생성합니다
 */
reservationRoutes.post(
  '/',
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      
      // 요청 데이터 파싱 및 검증
      const body = await c.req.json();
      const parsedRequest = CreateReservationRequestSchema.safeParse(body);
      
      if (!parsedRequest.success) {
        return respond(c, failure(400, 'VALIDATION_ERROR', '요청 데이터가 올바르지 않습니다'));
      }
      
      const request = parsedRequest.data;

      logger.info('Creating reservation', { 
        concertId: request.concertId,
        scheduleId: request.scheduleId,
        seatCount: request.seatIds.length,
        customerPhone: request.customerInfo.phone,
      });

      const reservation = await createReservation(supabase, request);

      logger.info('Reservation created successfully', {
        reservationId: reservation.reservationId,
        reservationNumber: reservation.reservationNumber,
      });

      return respond(c, success(reservation, 201));
    } catch (error) {
      const logger = c.get('logger');
      const errorMessage = error instanceof Error ? error.message : '예약 생성 중 오류가 발생했습니다';
      
      logger.error('Reservation creation failed', { 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return respond(c, failure(400, 'RESERVATION_ERROR', errorMessage));
    }
  }
);

/**
 * POST /api/schedules/:scheduleId/seats/summary
 * 선택된 좌석들의 요약 정보를 가져옵니다
 */
reservationRoutes.post(
  '/schedules/:scheduleId/seats/summary',
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const scheduleId = c.req.param('scheduleId');
      
      // 요청 데이터 파싱 및 검증
      const body = await c.req.json();
      const parsedRequest = SeatSummaryRequestSchema.safeParse(body);
      
      if (!parsedRequest.success) {
        return respond(c, failure(400, 'VALIDATION_ERROR', '요청 데이터가 올바르지 않습니다'));
      }
      
      const request = parsedRequest.data;

      if (!scheduleId) {
        return respond(c, failure(400, 'VALIDATION_ERROR', '스케줄 ID가 필요합니다'));
      }

      logger.info('Getting seat summary', { 
        scheduleId,
        seatIds: request.seatIds,
      });

      const summary = await getSeatSummary(supabase, scheduleId, request);

      return respond(c, success(summary));
    } catch (error) {
      const logger = c.get('logger');
      const errorMessage = error instanceof Error ? error.message : '좌석 요약 정보 조회 중 오류가 발생했습니다';
      
      logger.error('Seat summary failed', { 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return respond(c, failure(400, 'SEAT_SUMMARY_ERROR', errorMessage));
    }
  }
);

/**
 * GET /api/concerts/:concertId/schedule/:scheduleId
 * 콘서트와 스케줄 정보를 가져옵니다
 */
reservationRoutes.get(
  '/concerts/:concertId/schedule/:scheduleId',
  async (c) => {
    try {
      const supabase = c.get('supabase');
      const logger = c.get('logger');
      const concertId = c.req.param('concertId');
      const scheduleId = c.req.param('scheduleId');

      if (!concertId || !scheduleId) {
        return respond(c, failure(400, 'VALIDATION_ERROR', '콘서트 ID와 스케줄 ID가 필요합니다'));
      }

      logger.info('Getting concert schedule', { 
        concertId,
        scheduleId,
      });

      const concertSchedule = await getConcertSchedule(supabase, concertId, scheduleId);

      return respond(c, success(concertSchedule));
    } catch (error) {
      const logger = c.get('logger');
      const errorMessage = error instanceof Error ? error.message : '콘서트 정보 조회 중 오류가 발생했습니다';
      
      logger.error('Concert schedule failed', { 
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return respond(c, failure(400, 'CONCERT_SCHEDULE_ERROR', errorMessage));
    }
  }
);

export { reservationRoutes };
