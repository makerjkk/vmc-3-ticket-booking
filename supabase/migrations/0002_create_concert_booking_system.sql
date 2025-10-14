-- Migration: create concert booking system tables
-- 콘서트 예매 시스템을 위한 데이터베이스 스키마 생성

-- pgcrypto 확장 활성화 (UUID 생성용)
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. concerts 테이블 (콘서트 기본 정보)
-- ============================================================================
create table if not exists public.concerts (
    id uuid primary key default gen_random_uuid(),
    title varchar(255) not null,
    description text,
    poster_image_url text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_concerts_created_at on public.concerts(created_at);

-- 테이블 및 컬럼 코멘트
comment on table public.concerts is '콘서트 기본 정보';
comment on column public.concerts.id is '콘서트 고유 식별자';
comment on column public.concerts.title is '콘서트 제목';
comment on column public.concerts.description is '콘서트 설명';
comment on column public.concerts.poster_image_url is '포스터 이미지 URL';
comment on column public.concerts.created_at is '생성 시간';
comment on column public.concerts.updated_at is '수정 시간';

-- ============================================================================
-- 2. schedules 테이블 (공연 일정)
-- ============================================================================
create table if not exists public.schedules (
    id uuid primary key default gen_random_uuid(),
    concert_id uuid not null references public.concerts(id) on delete cascade,
    date_time timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_schedules_concert_id on public.schedules(concert_id);
create index if not exists idx_schedules_date_time on public.schedules(date_time);
create index if not exists idx_schedules_concert_date on public.schedules(concert_id, date_time);

-- 테이블 및 컬럼 코멘트
comment on table public.schedules is '콘서트 공연 일정';
comment on column public.schedules.id is '일정 고유 식별자';
comment on column public.schedules.concert_id is '콘서트 ID (외래키)';
comment on column public.schedules.date_time is '공연 날짜 및 시간';
comment on column public.schedules.created_at is '생성 시간';
comment on column public.schedules.updated_at is '수정 시간';

-- ============================================================================
-- 3. seats 테이블 (좌석 정보)
-- ============================================================================
create table if not exists public.seats (
    id uuid primary key default gen_random_uuid(),
    schedule_id uuid not null references public.schedules(id) on delete cascade,
    seat_number varchar(10) not null,
    grade varchar(5) not null,
    price integer not null,
    status varchar(20) not null default 'available' check (status in ('available', 'reserved')),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_seats_schedule_id on public.seats(schedule_id);
create index if not exists idx_seats_status on public.seats(status);
create index if not exists idx_seats_schedule_status on public.seats(schedule_id, status);
create unique index if not exists idx_seats_schedule_seat_unique on public.seats(schedule_id, seat_number);

-- 테이블 및 컬럼 코멘트
comment on table public.seats is '좌석 정보';
comment on column public.seats.id is '좌석 고유 식별자';
comment on column public.seats.schedule_id is '공연 일정 ID (외래키)';
comment on column public.seats.seat_number is '좌석 번호 (예: A10, B05)';
comment on column public.seats.grade is '좌석 등급 (R, S, A 등)';
comment on column public.seats.price is '좌석 가격';
comment on column public.seats.status is '좌석 상태 (available: 예약가능, reserved: 예약됨)';
comment on column public.seats.created_at is '생성 시간';
comment on column public.seats.updated_at is '수정 시간';

-- ============================================================================
-- 4. reservations 테이블 (예약 정보)
-- ============================================================================
create table if not exists public.reservations (
    id uuid primary key default gen_random_uuid(),
    schedule_id uuid not null references public.schedules(id) on delete restrict,
    seat_ids uuid[] not null,
    total_price integer not null,
    customer_name varchar(100) not null,
    customer_phone varchar(20) not null,
    customer_email varchar(255),
    status varchar(20) not null default 'confirmed' check (status in ('confirmed', 'cancelled')),
    created_at timestamptz not null default now(),
    cancelled_at timestamptz,
    updated_at timestamptz not null default now()
);

-- 인덱스 생성
create index if not exists idx_reservations_schedule_id on public.reservations(schedule_id);
create index if not exists idx_reservations_customer_phone on public.reservations(customer_phone);
create index if not exists idx_reservations_customer_email on public.reservations(customer_email);
create index if not exists idx_reservations_status on public.reservations(status);
create index if not exists idx_reservations_created_at on public.reservations(created_at);

-- 테이블 및 컬럼 코멘트
comment on table public.reservations is '예약 정보';
comment on column public.reservations.id is '예약 고유 식별자 (예약 번호로도 사용)';
comment on column public.reservations.schedule_id is '공연 일정 ID (외래키)';
comment on column public.reservations.seat_ids is '예약된 좌석 ID 배열';
comment on column public.reservations.total_price is '총 결제 금액';
comment on column public.reservations.customer_name is '예약자 이름';
comment on column public.reservations.customer_phone is '예약자 휴대폰 번호';
comment on column public.reservations.customer_email is '예약자 이메일 (선택사항)';
comment on column public.reservations.status is '예약 상태 (confirmed: 확정, cancelled: 취소)';
comment on column public.reservations.created_at is '예약 생성 시간';
comment on column public.reservations.cancelled_at is '취소 시간';
comment on column public.reservations.updated_at is '수정 시간';

-- ============================================================================
-- 5. updated_at 자동 업데이트 트리거 함수 및 트리거
-- ============================================================================

-- updated_at 자동 업데이트 함수 생성
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

-- 각 테이블에 updated_at 트리거 적용
drop trigger if exists update_concerts_updated_at on public.concerts;
create trigger update_concerts_updated_at 
    before update on public.concerts
    for each row execute function public.update_updated_at_column();

drop trigger if exists update_schedules_updated_at on public.schedules;
create trigger update_schedules_updated_at 
    before update on public.schedules
    for each row execute function public.update_updated_at_column();

drop trigger if exists update_seats_updated_at on public.seats;
create trigger update_seats_updated_at 
    before update on public.seats
    for each row execute function public.update_updated_at_column();

drop trigger if exists update_reservations_updated_at on public.reservations;
create trigger update_reservations_updated_at 
    before update on public.reservations
    for each row execute function public.update_updated_at_column();

-- ============================================================================
-- 6. Row Level Security 비활성화 (프로젝트 요구사항에 따라)
-- ============================================================================
alter table if exists public.concerts disable row level security;
alter table if exists public.schedules disable row level security;
alter table if exists public.seats disable row level security;
alter table if exists public.reservations disable row level security;

-- ============================================================================
-- 7. 샘플 데이터 삽입
-- ============================================================================

-- 콘서트 샘플 데이터
insert into public.concerts (title, description, poster_image_url)
values
  (
    '아이유 콘서트 2024',
    '아이유의 특별한 콘서트입니다. 따뜻한 겨울 밤을 함께 보내요.',
    'https://picsum.photos/seed/iu-concert-2024/400/600'
  ),
  (
    'BTS 월드 투어 서울',
    'BTS 글로벌 투어의 서울 공연입니다. 잊지 못할 추억을 만들어보세요.',
    'https://picsum.photos/seed/bts-world-tour/400/600'
  ),
  (
    '뉴진스 팬미팅',
    '뉴진스와 함께하는 특별한 팬미팅 시간입니다.',
    'https://picsum.photos/seed/newjeans-fanmeeting/400/600'
  )
on conflict do nothing;

-- 공연 일정 샘플 데이터
insert into public.schedules (concert_id, date_time)
select 
  c.id,
  case 
    when c.title = '아이유 콘서트 2024' then '2024-12-25 19:00:00+09'::timestamptz
    when c.title = 'BTS 월드 투어 서울' then '2024-12-31 20:00:00+09'::timestamptz
    else '2025-01-15 18:00:00+09'::timestamptz
  end
from public.concerts c
where c.title in ('아이유 콘서트 2024', 'BTS 월드 투어 서울', '뉴진스 팬미팅')
on conflict do nothing;

-- 추가 회차 (아이유 콘서트)
insert into public.schedules (concert_id, date_time)
select 
  c.id,
  '2024-12-26 19:00:00+09'::timestamptz
from public.concerts c
where c.title = '아이유 콘서트 2024'
on conflict do nothing;

-- 좌석 샘플 데이터 (각 공연별로 기본 좌석 생성)
do $$
declare
    schedule_rec record;
    seat_grades text[] := array['R', 'S', 'A'];
    seat_prices integer[] := array[150000, 120000, 90000];
    grade_idx integer;
    seat_num integer;
begin
    -- 각 스케줄에 대해 좌석 생성
    for schedule_rec in select id from public.schedules loop
        -- 각 등급별로 좌석 생성
        for grade_idx in 1..3 loop
            -- 각 등급당 20개 좌석 생성
            for seat_num in 1..20 loop
                insert into public.seats (schedule_id, seat_number, grade, price, status)
                values (
                    schedule_rec.id,
                    seat_grades[grade_idx] || lpad(seat_num::text, 2, '0'),
                    seat_grades[grade_idx],
                    seat_prices[grade_idx],
                    'available'
                )
                on conflict do nothing;
            end loop;
        end loop;
    end loop;
end $$;

-- ============================================================================
-- 8. 유용한 뷰 생성 (선택사항)
-- ============================================================================

-- 예매 가능한 콘서트 목록 뷰
create or replace view public.available_concerts as
select distinct 
    c.id,
    c.title,
    c.description,
    c.poster_image_url,
    c.created_at
from public.concerts c
inner join public.schedules s on c.id = s.concert_id
where s.date_time > now()
order by c.created_at desc;

comment on view public.available_concerts is '예매 가능한 콘서트 목록 뷰';

-- 좌석 현황 요약 뷰
create or replace view public.seat_summary as
select 
    s.id as schedule_id,
    c.title as concert_title,
    s.date_time,
    st.grade,
    count(*) as total_seats,
    count(case when st.status = 'available' then 1 end) as available_seats,
    count(case when st.status = 'reserved' then 1 end) as reserved_seats
from public.schedules s
inner join public.concerts c on s.concert_id = c.id
inner join public.seats st on s.id = st.schedule_id
group by s.id, c.title, s.date_time, st.grade
order by s.date_time, st.grade;

comment on view public.seat_summary is '공연별 좌석 현황 요약 뷰';
