import type { SupabaseClient } from '@supabase/supabase-js';
import {
  failure,
  success,
  type HandlerResult,
} from '@/backend/http/response';
import {
  scheduleErrorCodes,
  type ScheduleServiceError,
} from './error';
import {
  ScheduleListResponseSchema,
  ScheduleItemSchema,
  SeatLayoutResponseSchema,
  SeatCountUpdateSchema,
  ScheduleAvailabilitySchema,
  ScheduleTableRowSchema,
  SeatTableRowSchema,
  type ScheduleListResponse,
  type SeatLayoutResponse,
  type SeatCountUpdate,
  type ScheduleAvailability,
  type ScheduleTableRow,
  type SeatTableRow,
} from './schema';

// 테이블 이름 상수
const SCHEDULES_TABLE = 'schedules';
const SEATS_TABLE = 'seats';
const CONCERTS_TABLE = 'concerts';

/**
 * 특정 날짜의 회차 목록 조회
 */
export const getSchedulesByDate = async (
  client: SupabaseClient,
  concertId: string,
  date: string,
): Promise<HandlerResult<ScheduleListResponse, ScheduleServiceError, unknown>> => {
  try {
    // 날짜 유효성 검증 (과거 날짜 체크)
    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return failure(
        400,
        'PAST_DATE_SELECTED',
        '과거 날짜는 선택할 수 없습니다',
      );
    }

    // 콘서트 존재 여부 확인
    const { data: concertData, error: concertError } = await client
      .from(CONCERTS_TABLE)
      .select('id')
      .eq('id', concertId)
      .maybeSingle();

    if (concertError) {
      return failure(
        500,
        'DATABASE_ERROR',
        `콘서트 조회 실패: ${concertError.message}`,
      );
    }

    if (!concertData) {
      return failure(
        404,
        'SCHEDULE_NOT_FOUND',
        '콘서트를 찾을 수 없습니다',
      );
    }

    // 해당 날짜의 회차 목록 조회
    const startOfDay = `${date}T00:00:00`;
    const endOfDay = `${date}T23:59:59`;
    const now = new Date().toISOString();

    const { data: schedulesData, error: schedulesError } = await client
      .from(SCHEDULES_TABLE)
      .select('*')
      .eq('concert_id', concertId)
      .gte('date_time', startOfDay)
      .lte('date_time', endOfDay)
      .gte('date_time', now) // 현재 시간 이후만
      .order('date_time', { ascending: true });

    if (schedulesError) {
      return failure(
        500,
        'QUERY_ERROR',
        `회차 목록 조회 실패: ${schedulesError.message}`,
      );
    }

    if (!schedulesData || schedulesData.length === 0) {
      return success({
        schedules: [],
        total: 0,
        selectedDate: date,
      });
    }

    // 각 회차별 좌석 수 계산
    const scheduleItems = await Promise.all(
      schedulesData.map(async (schedule) => {
        // 스키마 검증
        const scheduleRowParse = ScheduleTableRowSchema.safeParse(schedule);
        if (!scheduleRowParse.success) {
          return null;
        }

        const scheduleRow = scheduleRowParse.data;

        // 해당 회차의 좌석 수 조회
        const { data: seatsData, error: seatsError } = await client
          .from(SEATS_TABLE)
          .select('status')
          .eq('schedule_id', scheduleRow.id);

        if (seatsError) {
          // 좌석 데이터 조회 실패 시 0으로 처리
          return {
            id: scheduleRow.id,
            concertId: scheduleRow.concert_id,
            dateTime: scheduleRow.date_time,
            availableSeats: 0,
            totalSeats: 0,
            isSoldOut: true,
            isAlmostSoldOut: false,
          };
        }

        const totalSeats = seatsData?.length || 0;
        const availableSeats = seatsData?.filter(seat => seat.status === 'available').length || 0;
        const isSoldOut = availableSeats === 0;
        const isAlmostSoldOut = !isSoldOut && availableSeats <= 10;

        return {
          id: scheduleRow.id,
          concertId: scheduleRow.concert_id,
          dateTime: scheduleRow.date_time,
          availableSeats,
          totalSeats,
          isSoldOut,
          isAlmostSoldOut,
        };
      })
    );

    // null 값 필터링 및 스키마 검증
    const validSchedules = scheduleItems
      .filter((item): item is NonNullable<typeof item> => item !== null)
      .map(item => {
        const parsed = ScheduleItemSchema.safeParse(item);
        return parsed.success ? parsed.data : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);

    const response = {
      schedules: validSchedules,
      total: validSchedules.length,
      selectedDate: date,
    };

    // 응답 스키마 검증
    const responseParse = ScheduleListResponseSchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        'SCHEMA_VALIDATION_FAILED',
        '회차 목록 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      'UNKNOWN_ERROR',
      `회차 목록 조회 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 좌석 배치도 데이터 조회
 */
export const getSeatLayout = async (
  client: SupabaseClient,
  scheduleId: string,
): Promise<HandlerResult<SeatLayoutResponse, ScheduleServiceError, unknown>> => {
  try {
    // 회차 존재 여부 확인
    const { data: scheduleData, error: scheduleError } = await client
      .from(SCHEDULES_TABLE)
      .select('id, date_time')
      .eq('id', scheduleId)
      .maybeSingle();

    if (scheduleError) {
      return failure(
        500,
        'DATABASE_ERROR',
        `회차 조회 실패: ${scheduleError.message}`,
      );
    }

    if (!scheduleData) {
      return failure(
        404,
        'SCHEDULE_NOT_FOUND',
        '회차를 찾을 수 없습니다',
      );
    }

    // 회차가 과거인지 확인
    const scheduleDateTime = new Date(scheduleData.date_time);
    const now = new Date();
    
    if (scheduleDateTime < now) {
      return failure(
        409,
        scheduleErrorCodes.scheduleExpired,
        '선택하신 회차의 예매 시간이 지났습니다',
      );
    }

    // 좌석 데이터 조회
    const { data: seatsData, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('*')
      .eq('schedule_id', scheduleId)
      .order('seat_number', { ascending: true });

    if (seatsError) {
      return failure(
        500,
        scheduleErrorCodes.seatDataLoadFailed,
        `좌석 데이터 조회 실패: ${seatsError.message}`,
      );
    }

    if (!seatsData || seatsData.length === 0) {
      return failure(
        404,
        scheduleErrorCodes.seatDataLoadFailed,
        '좌석 정보가 없습니다',
      );
    }

    // 좌석 데이터 변환 및 검증
    const validSeats = seatsData
      .map(seat => {
        const seatRowParse = SeatTableRowSchema.safeParse(seat);
        if (!seatRowParse.success) {
          return null;
        }

        const seatRow = seatRowParse.data;
        return {
          id: seatRow.id,
          scheduleId: seatRow.schedule_id,
          seatNumber: seatRow.seat_number,
          grade: seatRow.grade as 'R' | 'S' | 'A',
          price: seatRow.price,
          status: seatRow.status as 'available' | 'reserved',
        };
      })
      .filter((seat): seat is NonNullable<typeof seat> => seat !== null);

    // 등급별 정보 계산
    const gradeInfo = ['R', 'S', 'A'].map(grade => {
      const gradeSeats = validSeats.filter(seat => seat.grade === grade);
      const availableSeats = gradeSeats.filter(seat => seat.status === 'available').length;
      const price = gradeSeats.length > 0 ? gradeSeats[0].price : 0;
      
      // 등급별 색상 정의
      const colorMap = {
        'R': '#5C6BFF', // Primary Color
        'S': '#28E0FF', // Secondary Color  
        'A': '#10B981', // Success Color
      };

      return {
        grade: grade as 'R' | 'S' | 'A',
        price,
        color: colorMap[grade as keyof typeof colorMap],
        totalSeats: gradeSeats.length,
        availableSeats,
      };
    }).filter(info => info.totalSeats > 0);

    const totalSeats = validSeats.length;
    const availableSeats = validSeats.filter(seat => seat.status === 'available').length;

    const response = {
      scheduleId,
      seats: validSeats,
      totalSeats,
      availableSeats,
      gradeInfo,
    };

    // 응답 스키마 검증
    const responseParse = SeatLayoutResponseSchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        scheduleErrorCodes.schemaValidationFailed,
        '좌석 배치도 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `좌석 배치도 조회 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 실시간 좌석 수 조회
 */
export const getSeatCount = async (
  client: SupabaseClient,
  scheduleId: string,
): Promise<HandlerResult<SeatCountUpdate, ScheduleServiceError, unknown>> => {
  try {
    // 회차 존재 여부 확인
    const { data: scheduleData, error: scheduleError } = await client
      .from(SCHEDULES_TABLE)
      .select('id')
      .eq('id', scheduleId)
      .maybeSingle();

    if (scheduleError) {
      return failure(
        500,
        scheduleErrorCodes.databaseError,
        `회차 조회 실패: ${scheduleError.message}`,
      );
    }

    if (!scheduleData) {
      return failure(
        404,
        scheduleErrorCodes.scheduleNotFound,
        '회차를 찾을 수 없습니다',
      );
    }

    // 좌석 수 조회
    const { data: seatsData, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('grade, status')
      .eq('schedule_id', scheduleId);

    if (seatsError) {
      return failure(
        500,
        scheduleErrorCodes.seatDataLoadFailed,
        `좌석 수 조회 실패: ${seatsError.message}`,
      );
    }

    const totalSeats = seatsData?.length || 0;
    const availableSeats = seatsData?.filter(seat => seat.status === 'available').length || 0;

    // 등급별 좌석 수 계산
    const gradeBreakdown = ['R', 'S', 'A'].map(grade => {
      const gradeSeats = seatsData?.filter(seat => seat.grade === grade) || [];
      const gradeAvailableSeats = gradeSeats.filter(seat => seat.status === 'available').length;
      
      return {
        grade: grade as 'R' | 'S' | 'A',
        availableSeats: gradeAvailableSeats,
        totalSeats: gradeSeats.length,
      };
    }).filter(info => info.totalSeats > 0);

    const response = {
      scheduleId,
      availableSeats,
      totalSeats,
      lastUpdated: new Date().toISOString(),
      gradeBreakdown,
    };

    // 응답 스키마 검증
    const responseParse = SeatCountUpdateSchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        scheduleErrorCodes.schemaValidationFailed,
        '좌석 수 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `좌석 수 조회 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 회차 예매 가능 여부 검증
 */
export const validateScheduleAvailability = async (
  client: SupabaseClient,
  scheduleId: string,
): Promise<HandlerResult<ScheduleAvailability, ScheduleServiceError, unknown>> => {
  try {
    // 회차 정보 조회
    const { data: scheduleData, error: scheduleError } = await client
      .from(SCHEDULES_TABLE)
      .select('id, date_time')
      .eq('id', scheduleId)
      .maybeSingle();

    if (scheduleError) {
      return failure(
        500,
        scheduleErrorCodes.databaseError,
        `회차 조회 실패: ${scheduleError.message}`,
      );
    }

    if (!scheduleData) {
      return failure(
        404,
        scheduleErrorCodes.scheduleNotFound,
        '회차를 찾을 수 없습니다',
      );
    }

    // 시간 검증
    const scheduleDateTime = new Date(scheduleData.date_time);
    const now = new Date();
    
    if (scheduleDateTime < now) {
      const response = {
        scheduleId,
        available: false,
        reason: '선택하신 회차의 예매 시간이 지났습니다',
        availableSeats: 0,
      };

      const responseParse = ScheduleAvailabilitySchema.safeParse(response);
      if (!responseParse.success) {
        return failure(
          500,
          scheduleErrorCodes.schemaValidationFailed,
          '예매 가능 여부 응답 검증 실패',
        );
      }

      return success(responseParse.data);
    }

    // 좌석 수 조회
    const { data: seatsData, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('status')
      .eq('schedule_id', scheduleId);

    if (seatsError) {
      return failure(
        500,
        scheduleErrorCodes.seatDataLoadFailed,
        `좌석 수 조회 실패: ${seatsError.message}`,
      );
    }

    const availableSeats = seatsData?.filter(seat => seat.status === 'available').length || 0;
    const available = availableSeats > 0;
    const reason = available ? undefined : '선택하신 회차가 매진되었습니다';

    const response = {
      scheduleId,
      available,
      reason,
      availableSeats,
    };

    // 응답 스키마 검증
    const responseParse = ScheduleAvailabilitySchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        scheduleErrorCodes.schemaValidationFailed,
        '예매 가능 여부 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `예매 가능 여부 검증 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};
