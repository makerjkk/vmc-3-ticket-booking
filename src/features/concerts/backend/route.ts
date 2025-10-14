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
import { ConcertAvailabilityParamsSchema } from './schema';
import { getConcertList, checkConcertAvailability } from './service';
import { createTestConcerts } from './test-data';
import {
  concertErrorCodes,
  type ConcertServiceError,
} from './error';

export const registerConcertRoutes = (app: Hono<AppEnv>) => {
  // 콘서트 목록 조회
  app.get('/api/concerts', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('콘서트 목록 조회 요청');

    const result = await getConcertList(supabase);

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      
      if (errorResult.error.code === concertErrorCodes.fetchError) {
        logger.error('콘서트 목록 조회 실패', errorResult.error.message);
      } else if (errorResult.error.code === concertErrorCodes.databaseError) {
        logger.error('데이터베이스 오류', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(`콘서트 목록 조회 성공: ${result.data.total}개`);
    return respond(c, result);
  });

  // 콘서트 예매 가능 여부 확인
  app.get('/api/concerts/:concertId/availability', async (c) => {
    const parsedParams = ConcertAvailabilityParamsSchema.safeParse({
      concertId: c.req.param('concertId'),
    });

    if (!parsedParams.success) {
      return respond(
        c,
        failure(
          400,
          concertErrorCodes.validationError,
          '유효하지 않은 콘서트 ID입니다',
          parsedParams.error.format(),
        ),
      );
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info(`콘서트 예매 가능 여부 확인 요청: ${parsedParams.data.concertId}`);

    const result = await checkConcertAvailability(supabase, parsedParams.data.concertId);

    if (!result.ok) {
      const errorResult = result as ErrorResult<string, unknown>;
      
      if (errorResult.error.code === concertErrorCodes.notFound) {
        logger.warn(`콘서트를 찾을 수 없음: ${parsedParams.data.concertId}`);
      } else if (errorResult.error.code === concertErrorCodes.availabilityCheckError) {
        logger.error('예매 가능 여부 확인 실패', errorResult.error.message);
      }

      return respond(c, result);
    }

    logger.info(`콘서트 예매 가능 여부 확인 성공: ${parsedParams.data.concertId}, available: ${result.data.available}`);
    return respond(c, result);
  });

  // 테스트 데이터 생성 (개발용)
  app.post('/api/concerts/test-data', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('테스트 데이터 생성 요청');

    try {
      await createTestConcerts(supabase);
      logger.info('테스트 데이터 생성 성공');
      
      return c.json({ 
        success: true, 
        message: '테스트 데이터가 성공적으로 생성되었습니다.' 
      });
    } catch (error) {
      logger.error('테스트 데이터 생성 실패', error);
      
      return c.json({ 
        success: false, 
        message: '테스트 데이터 생성에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 500);
    }
  });

  // 테스트 데이터 초기화 (개발용)
  app.post('/api/concerts/reset-data', async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    logger.info('테스트 데이터 초기화 요청');

    try {
      // 기존 데이터 삭제 (외래키 제약으로 인해 순서 중요)
      await supabase.from('schedules').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('concerts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      logger.info('기존 데이터 삭제 완료');
      
      // 새 데이터 생성
      await createTestConcerts(supabase);
      logger.info('새 테스트 데이터 생성 성공');
      
      return c.json({ 
        success: true, 
        message: '테스트 데이터가 초기화되고 새로 생성되었습니다.' 
      });
    } catch (error) {
      logger.error('테스트 데이터 초기화 실패', error);
      
      return c.json({ 
        success: false, 
        message: '테스트 데이터 초기화에 실패했습니다.',
        error: error instanceof Error ? error.message : '알 수 없는 오류'
      }, 500);
    }
  });
};
