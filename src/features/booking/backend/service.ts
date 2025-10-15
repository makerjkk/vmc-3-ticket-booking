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
  SeatDataSchema,
  SeatHoldResponseSchema,
  SeatStatusUpdateSchema,
  SeatConflictResponseSchema,
  type ScheduleListResponse,
  type SeatLayoutResponse,
  type SeatCountUpdate,
  type ScheduleAvailability,
  type ScheduleTableRow,
  type SeatTableRow,
  type SeatData,
  type SeatHoldResponse,
  type SeatStatusUpdate,
  type SeatConflictResponse,
} from './schema';

// 테이블 이름 상수
const SCHEDULES_TABLE = 'schedules';
const SEATS_TABLE = 'seats';
const CONCERTS_TABLE = 'concerts';
const SEAT_HOLDS_TABLE = 'seat_holds';

/**
 * 콘서트 기본 정보 조회
 */
export const getConcertInfo = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<{ id: string; title: string; description: string | null; posterImageUrl: string | null; createdAt: string; updatedAt: string }, ScheduleServiceError, unknown>> => {
  try {
    // 콘서트 정보 조회
    const { data: concertData, error: concertError } = await client
      .from(CONCERTS_TABLE)
      .select('id, title, description, poster_image_url, created_at, updated_at')
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

    return success({
      id: concertData.id,
      title: concertData.title,
      description: concertData.description,
      posterImageUrl: concertData.poster_image_url,
      createdAt: concertData.created_at,
      updatedAt: concertData.updated_at,
    });
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `콘서트 정보 조회 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

/**
 * 예매 가능한 날짜 목록 조회
 */
export const getAvailableDates = async (
  client: SupabaseClient,
  concertId: string,
): Promise<HandlerResult<{ concertId: string; availableDates: Array<{ date: string; scheduleCount: number; hasAvailableSeats: boolean }> }, ScheduleServiceError, unknown>> => {
  try {
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

    // 현재 시간 이후의 스케줄과 좌석 정보 조회
    const now = new Date().toISOString();
    
    const { data: schedulesData, error: schedulesError } = await client
      .from(SCHEDULES_TABLE)
      .select(`
        id,
        date_time,
        seats(
          id,
          status
        )
      `)
      .eq('concert_id', concertId)
      .gte('date_time', now)
      .order('date_time', { ascending: true });

    if (schedulesError) {
      return failure(
        500,
        'DATABASE_ERROR',
        `스케줄 조회 실패: ${schedulesError.message}`,
      );
    }

    // 날짜별로 그룹화하고 예매 가능 여부 계산
    const dateMap = new Map<string, { 
      scheduleCount: number; 
      hasAvailableSeats: boolean;
      schedules: Array<{
        time: string;
        dateTime: string;
        hasAvailableSeats: boolean;
      }>;
    }>();

    if (schedulesData) {
      schedulesData.forEach((schedule) => {
        const date = schedule.date_time.split('T')[0]; // YYYY-MM-DD 형식으로 변환
        const availableSeats = schedule.seats?.filter((seat: any) => seat.status === 'available').length || 0;
        const hasScheduleSeats = availableSeats > 0;
        
        if (!dateMap.has(date)) {
          dateMap.set(date, { 
            scheduleCount: 0, 
            hasAvailableSeats: false,
            schedules: []
          });
        }
        
        const dateInfo = dateMap.get(date)!;
        dateInfo.scheduleCount += 1;
        if (hasScheduleSeats) {
          dateInfo.hasAvailableSeats = true;
        }
        
        // 스케줄 시간 정보 추가 (한국 시간 기준)
        const scheduleTime = new Date(schedule.date_time);
        const timeString = scheduleTime.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Seoul'
        });
        
        // 원본 dateTime을 그대로 반환 (Supabase timestamptz)
        dateInfo.schedules.push({
          time: timeString,
          dateTime: schedule.date_time,
          hasAvailableSeats: hasScheduleSeats
        });
      });
    }

    // 결과 배열로 변환
    const availableDates = Array.from(dateMap.entries()).map(([date, info]) => ({
      date,
      scheduleCount: info.scheduleCount,
      hasAvailableSeats: info.hasAvailableSeats,
      schedules: info.schedules.sort((a, b) => a.time.localeCompare(b.time)) // 시간순 정렬
    }));

    return success({
      concertId,
      availableDates,
    });
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `예매 가능한 날짜 조회 중 오류 발생: ${error instanceof Error ? error.message : 'Unknown error'}`,
    );
  }
};

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
          // 한국 시간 기준 시간 문자열 생성
          const scheduleTime = new Date(scheduleRow.date_time);
          const timeString = scheduleTime.toLocaleTimeString('ko-KR', { 
            hour: '2-digit', 
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Seoul'
          });
          
          // 좌석 데이터 조회 실패 시 0으로 처리
          return {
            id: scheduleRow.id,
            concertId: scheduleRow.concert_id,
            dateTime: scheduleRow.date_time,
            time: timeString,
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

        // 한국 시간 기준 시간 문자열 생성
        const scheduleTime = new Date(scheduleRow.date_time);
        const timeString = scheduleTime.toLocaleTimeString('ko-KR', { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false,
          timeZone: 'Asia/Seoul'
        });

        // 디버깅: 실제 데이터 확인
        console.log('[Schedule Debug]', {
          originalDateTime: scheduleRow.date_time,
          parsedTime: scheduleTime.toISOString(),
          kstTime: timeString,
        });

        return {
          id: scheduleRow.id,
          concertId: scheduleRow.concert_id,
          dateTime: scheduleRow.date_time,
          time: timeString, // 한국 시간 기준 시간 (예: "19:00")
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
      scheduleErrorCodes.unknownError,
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
        '해당 회차에 좌석 정보가 없습니다. 다른 회차를 선택해주세요.',
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
          rowName: seatRow.row_name,
          seatIndex: seatRow.seat_index,
          grade: seatRow.grade as 'R' | 'S' | 'A',
          price: seatRow.price,
          status: seatRow.status as 'available' | 'reserved' | 'held',
          xPosition: seatRow.x_position || undefined,
          yPosition: seatRow.y_position || undefined,
          metadata: {
            isAccessible: seatRow.is_accessible || undefined,
            hasObstruction: seatRow.has_obstruction || undefined,
            sightlineRating: seatRow.sightline_rating || undefined,
          },
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

/**
 * 좌석 상태 업데이트 조회 (실시간 동기화용)
 */
export const getSeatStatusUpdate = async (
  client: SupabaseClient,
  scheduleId: string,
): Promise<HandlerResult<SeatStatusUpdate, ScheduleServiceError, unknown>> => {
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

    // 좌석 데이터 변환
    const validSeats = (seatsData || [])
      .map(seat => {
        const seatRowParse = SeatTableRowSchema.safeParse(seat);
        if (!seatRowParse.success) {
          return null;
        }

        const seatRow = seatRowParse.data;
        const seatData: SeatData = {
          id: seatRow.id,
          scheduleId: seatRow.schedule_id,
          seatNumber: seatRow.seat_number,
          rowName: seatRow.row_name,
          seatIndex: seatRow.seat_index,
          grade: seatRow.grade as 'R' | 'S' | 'A',
          price: seatRow.price,
          status: seatRow.status as 'available' | 'reserved' | 'held',
          xPosition: seatRow.x_position || undefined,
          yPosition: seatRow.y_position || undefined,
          metadata: {
            isAccessible: seatRow.is_accessible || undefined,
            hasObstruction: seatRow.has_obstruction || undefined,
            sightlineRating: seatRow.sightline_rating || undefined,
          },
        };

        // 스키마 검증
        const seatDataParse = SeatDataSchema.safeParse(seatData);
        return seatDataParse.success ? seatDataParse.data : null;
      })
      .filter((seat): seat is NonNullable<typeof seat> => seat !== null);

    const response: SeatStatusUpdate = {
      scheduleId,
      seats: validSeats,
      timestamp: new Date().toISOString(),
    };

    // 응답 스키마 검증
    const responseParse = SeatStatusUpdateSchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        scheduleErrorCodes.schemaValidationFailed,
        '좌석 상태 업데이트 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `좌석 상태 업데이트 조회 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 좌석 홀드 처리
 */
export const holdSeats = async (
  client: SupabaseClient,
  scheduleId: string,
  seatIds: string[],
  holdDuration: number = 300, // 5분 기본값
): Promise<HandlerResult<SeatHoldResponse, ScheduleServiceError, unknown>> => {
  try {
    // 트랜잭션 시작
    const { data: transactionResult, error: transactionError } = await client.rpc(
      'hold_seats_transaction',
      {
        p_schedule_id: scheduleId,
        p_seat_ids: seatIds,
        p_hold_duration: holdDuration,
      }
    );

    if (transactionError) {
      // 충돌 에러인지 확인
      if (transactionError.message.includes('conflict') || transactionError.message.includes('already_held')) {
        // 충돌된 좌석 조회
        const { data: conflictSeats } = await client
          .from(SEATS_TABLE)
          .select('id')
          .in('id', seatIds)
          .neq('status', 'available');

        const conflictSeatIds = conflictSeats?.map(seat => seat.id) || [];

        return failure(
          409,
          scheduleErrorCodes.seatConflict,
          '선택하신 좌석 중 일부가 다른 사용자에게 예약되었습니다',
          { conflictSeats: conflictSeatIds },
        );
      }

      return failure(
        500,
        scheduleErrorCodes.seatHoldFailed,
        `좌석 홀드 실패: ${transactionError.message}`,
      );
    }

    if (!transactionResult || !transactionResult.hold_id) {
      return failure(
        500,
        scheduleErrorCodes.seatHoldFailed,
        '좌석 홀드 결과를 받을 수 없습니다',
      );
    }

    const expiresAt = new Date(Date.now() + holdDuration * 1000).toISOString();

    const response: SeatHoldResponse = {
      holdId: transactionResult.hold_id,
      seatIds,
      expiresAt,
      holdDuration,
    };

    // 응답 스키마 검증
    const responseParse = SeatHoldResponseSchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        scheduleErrorCodes.schemaValidationFailed,
        '좌석 홀드 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `좌석 홀드 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 좌석 홀드 해제
 */
export const releaseSeats = async (
  client: SupabaseClient,
  holdId: string,
): Promise<HandlerResult<{ success: boolean }, ScheduleServiceError, unknown>> => {
  try {
    const { error: releaseError } = await client.rpc('release_seat_hold', {
      p_hold_id: holdId,
    });

    if (releaseError) {
      return failure(
        500,
        scheduleErrorCodes.seatReleaseFailed,
        `좌석 홀드 해제 실패: ${releaseError.message}`,
      );
    }

    return success({ success: true });
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `좌석 홀드 해제 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 만료된 좌석 홀드 정리
 */
export const cleanupExpiredHolds = async (
  client: SupabaseClient,
): Promise<HandlerResult<{ cleanedCount: number }, ScheduleServiceError, unknown>> => {
  try {
    const { data: cleanupResult, error: cleanupError } = await client.rpc('cleanup_expired_holds');

    if (cleanupError) {
      return failure(
        500,
        scheduleErrorCodes.cleanupFailed,
        `만료된 홀드 정리 실패: ${cleanupError.message}`,
      );
    }

    return success({ cleanedCount: cleanupResult?.cleaned_count || 0 });
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `만료된 홀드 정리 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};

/**
 * 좌석 선택 충돌 감지
 */
export const detectSeatConflicts = async (
  client: SupabaseClient,
  scheduleId: string,
  selectedSeatIds: string[],
): Promise<HandlerResult<SeatConflictResponse, ScheduleServiceError, unknown>> => {
  try {
    // 선택된 좌석들의 현재 상태 조회
    const { data: seatsData, error: seatsError } = await client
      .from(SEATS_TABLE)
      .select('id, status')
      .eq('schedule_id', scheduleId)
      .in('id', selectedSeatIds);

    if (seatsError) {
      return failure(
        500,
        scheduleErrorCodes.seatDataLoadFailed,
        `좌석 상태 조회 실패: ${seatsError.message}`,
      );
    }

    // 충돌된 좌석 찾기
    const conflictSeats = (seatsData || [])
      .filter(seat => seat.status !== 'available')
      .map(seat => seat.id);

    let suggestedSeats: SeatData[] = [];

    // 충돌이 있는 경우 대안 좌석 제안
    if (conflictSeats.length > 0) {
      const { data: alternativeSeats } = await client
        .from(SEATS_TABLE)
        .select('*')
        .eq('schedule_id', scheduleId)
        .eq('status', 'available')
        .limit(conflictSeats.length * 2); // 충돌 수의 2배만큼 대안 제공

      if (alternativeSeats) {
        suggestedSeats = alternativeSeats
          .map(seat => {
            const seatRowParse = SeatTableRowSchema.safeParse(seat);
            if (!seatRowParse.success) return null;

            const seatRow = seatRowParse.data;
            return {
              id: seatRow.id,
              scheduleId: seatRow.schedule_id,
              seatNumber: seatRow.seat_number,
              rowName: seatRow.row_name,
              seatIndex: seatRow.seat_index,
              grade: seatRow.grade as 'R' | 'S' | 'A',
              price: seatRow.price,
              status: seatRow.status as 'available' | 'reserved' | 'held',
              xPosition: seatRow.x_position || undefined,
              yPosition: seatRow.y_position || undefined,
              metadata: {
                isAccessible: seatRow.is_accessible || undefined,
                hasObstruction: seatRow.has_obstruction || undefined,
                sightlineRating: seatRow.sightline_rating || undefined,
              },
            };
          })
          .filter((seat): seat is NonNullable<typeof seat> => seat !== null);
      }
    }

    const response: SeatConflictResponse = {
      conflictSeats,
      message: conflictSeats.length > 0 
        ? `선택하신 좌석 중 ${conflictSeats.length}석이 다른 사용자에게 예약되었습니다`
        : '선택하신 좌석에 충돌이 없습니다',
      suggestedSeats: suggestedSeats.length > 0 ? suggestedSeats : undefined,
    };

    // 응답 스키마 검증
    const responseParse = SeatConflictResponseSchema.safeParse(response);
    if (!responseParse.success) {
      return failure(
        500,
        scheduleErrorCodes.schemaValidationFailed,
        '좌석 충돌 응답 검증 실패',
        responseParse.error.format(),
      );
    }

    return success(responseParse.data);
  } catch (error) {
    return failure(
      500,
      scheduleErrorCodes.unknownError,
      `좌석 충돌 감지 중 예상치 못한 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`,
    );
  }
};
