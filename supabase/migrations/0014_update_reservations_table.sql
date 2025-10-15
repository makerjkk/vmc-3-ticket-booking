-- Migration: Update reservations table
-- 예약 테이블에 concert_id와 reservation_number 필드 추가

-- concert_id 컬럼 추가
alter table if exists public.reservations 
add column if not exists concert_id uuid references public.concerts(id) on delete restrict;

-- reservation_number 컬럼 추가 (예약 번호)
alter table if exists public.reservations 
add column if not exists reservation_number varchar(20) unique;

-- 인덱스 추가
create index if not exists idx_reservations_concert_id on public.reservations(concert_id);
create index if not exists idx_reservations_reservation_number on public.reservations(reservation_number);

-- 컬럼 코멘트 추가
comment on column public.reservations.concert_id is '콘서트 ID (외래키)';
comment on column public.reservations.reservation_number is '예약 번호 (사용자에게 표시되는 고유 번호)';

-- 기존 데이터에 대해 concert_id 업데이트 (schedules 테이블을 통해)
update public.reservations 
set concert_id = s.concert_id
from public.schedules s
where public.reservations.schedule_id = s.id
and public.reservations.concert_id is null;

-- 기존 데이터에 대해 reservation_number 생성 (CTE 사용)
with numbered_reservations as (
  select 
    id,
    'R' || to_char(created_at, 'YYMMDD') || lpad((row_number() over (order by created_at))::text, 4, '0') as new_reservation_number
  from public.reservations 
  where reservation_number is null
)
update public.reservations 
set reservation_number = nr.new_reservation_number
from numbered_reservations nr
where public.reservations.id = nr.id;

-- concert_id를 NOT NULL로 변경 (기존 데이터 업데이트 후)
alter table if exists public.reservations 
alter column concert_id set not null;

-- reservation_number를 NOT NULL로 변경 (기존 데이터 업데이트 후)
alter table if exists public.reservations 
alter column reservation_number set not null;
