import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * 테스트용 콘서트 데이터 생성
 */
export const createTestConcerts = async (client: SupabaseClient) => {
  try {
    // 1. 기존 데이터 확인
    const { data: existingConcerts, error: existingError } = await client
      .from('concerts')
      .select('id')
      .limit(1);

    console.log('기존 콘서트 확인:', existingConcerts, existingError);

    if (existingConcerts && existingConcerts.length > 0) {
      console.log('테스트 데이터가 이미 존재합니다. 개수:', existingConcerts.length);
      return;
    }

    // 2. 콘서트 데이터 생성
    const concertsToInsert = [
      {
        title: '아이유 콘서트 2024',
        description: '아이유의 특별한 콘서트가 찾아옵니다.',
        poster_image_url: 'https://picsum.photos/seed/iu-concert/400/600',
      },
      {
        title: 'BTS 월드 투어 서울',
        description: 'BTS의 월드 투어 서울 공연입니다.',
        poster_image_url: 'https://picsum.photos/seed/bts-concert/400/600',
      },
      {
        title: '뉴진스 팬미팅',
        description: '뉴진스와 함께하는 특별한 팬미팅 시간입니다.',
        poster_image_url: 'https://picsum.photos/seed/newjeans-fanmeeting/400/600',
      },
    ];

    const { data: insertedConcerts, error: concertError } = await client
      .from('concerts')
      .insert(concertsToInsert)
      .select('id, title');

    if (concertError) {
      console.error('콘서트 데이터 생성 실패:', concertError);
      return;
    }

    console.log('콘서트 데이터 생성 성공:', insertedConcerts);

    // 3. 스케줄 데이터 생성
    if (insertedConcerts) {
      const schedulesToInsert = [];
      const now = new Date();
      
      for (const concert of insertedConcerts) {
        // 각 콘서트마다 2-3개의 미래 일정 생성
        const scheduleCount = Math.floor(Math.random() * 2) + 2; // 2-3개
        
        for (let i = 0; i < scheduleCount; i++) {
          const futureDate = new Date(now);
          futureDate.setDate(now.getDate() + 30 + (i * 7)); // 30일 후부터 일주일 간격
          futureDate.setHours(19, 0, 0, 0); // 오후 7시
          
          schedulesToInsert.push({
            concert_id: concert.id,
            date_time: futureDate.toISOString(),
          });
        }
      }

      const { data: insertedSchedules, error: scheduleError } = await client
        .from('schedules')
        .insert(schedulesToInsert)
        .select('id');

      if (scheduleError) {
        console.error('스케줄 데이터 생성 실패:', scheduleError);
        return;
      }

      console.log('스케줄 데이터 생성 성공:', insertedSchedules?.length, '개');
    }

    console.log('테스트 데이터 생성 완료!');
  } catch (error) {
    console.error('테스트 데이터 생성 중 오류:', error);
  }
};
