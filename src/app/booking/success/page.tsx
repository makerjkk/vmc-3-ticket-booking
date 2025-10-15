'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, Calendar, MapPin, Ticket, User, Phone, Mail, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { apiClient } from '@/lib/remote/api-client';
import type { ReservationDetailResponse } from '@/features/reservations/lib/dto';
import { formatPrice } from '@/features/booking/lib/validation-utils';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function BookingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reservationId = searchParams.get('reservationId');

  const [reservation, setReservation] = useState<ReservationDetailResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!reservationId) {
      router.replace('/');
      return;
    }

    const fetchReservationDetail = async () => {
      setIsLoading(true);
      setError(null);

      apiClient
        .get(`/api/reservations/${reservationId}`)
        .then((response) => {
          if (response.data.ok) {
            setReservation(response.data.data);
          } else {
            setError('예약 정보를 찾을 수 없습니다');
          }
        })
        .catch((err) => {
          console.error('Reservation fetch error:', err);
          setError('예약 정보를 불러오는 중 오류가 발생했습니다');
        })
        .finally(() => {
          setIsLoading(false);
        });
    };

    fetchReservationDetail();
  }, [reservationId, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent"></div>
          <p className="mt-4 text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  if (error || !reservation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader>
            <CardTitle className="text-center text-destructive">오류</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-gray-600">{error || '예약 정보를 찾을 수 없습니다'}</p>
            <Button onClick={() => router.push('/')}>메인으로 돌아가기</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const scheduleDate = new Date(reservation.scheduleDateTime);
  const formattedDate = format(scheduleDate, 'yyyy년 MM월 dd일 (E) HH:mm', { locale: ko });

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-gray-50">
      <div className="container mx-auto px-4 py-12 max-w-3xl">
        {/* 성공 헤더 */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
            <CheckCircle className="w-12 h-12 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">예약이 완료되었습니다!</h1>
          <p className="text-gray-600">예약 내역을 확인해주세요</p>
        </div>

        {/* 예약 정보 카드 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Ticket className="w-5 h-5" />
              예약 정보
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 예약 번호 */}
            <div className="bg-primary/5 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">예약 번호</p>
              <p className="text-2xl font-mono font-bold text-primary">
                {reservation.reservationNumber}
              </p>
              <p className="text-xs text-gray-500 mt-2">예약 ID: {reservation.reservationId}</p>
            </div>

            <Separator />

            {/* 공연 정보 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Ticket className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">공연명</p>
                  <p className="font-semibold text-gray-900">{reservation.concertTitle}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">공연 일시</p>
                  <p className="font-semibold text-gray-900">{formattedDate}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">선택 좌석</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {reservation.seats.map((seat, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground"
                      >
                        {seat.seatNumber} ({seat.grade}석)
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* 예약자 정보 */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">예약자명</p>
                  <p className="font-semibold text-gray-900">{reservation.customerName}</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-600">연락처</p>
                  <p className="font-semibold text-gray-900">{reservation.customerPhone}</p>
                </div>
              </div>

              {reservation.customerEmail && (
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-gray-600">이메일</p>
                    <p className="font-semibold text-gray-900">{reservation.customerEmail}</p>
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* 결제 정보 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">좌석 수</span>
                <span className="font-medium">{reservation.seatCount}석</span>
              </div>
              {reservation.seats.map((seat, index) => (
                <div key={index} className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">
                    {seat.seatNumber} ({seat.grade}석)
                  </span>
                  <span className="text-gray-600">{formatPrice(seat.price)}</span>
                </div>
              ))}
              <Separator className="my-2" />
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold">총 결제 금액</span>
                <span className="text-xl font-bold text-primary">
                  {formatPrice(reservation.totalPrice)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 안내 사항 */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-base">안내 사항</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-gray-600">
            <p>• 예약 번호는 공연 당일 매표소에서 티켓 수령 시 필요합니다</p>
            <p>• 예약 번호를 캡처하거나 메모해두시기 바랍니다</p>
            <p>• 공연 시작 30분 전까지 매표소에서 티켓을 수령해주세요</p>
            <p>• 예약 취소는 고객센터로 문의해주시기 바랍니다</p>
          </CardContent>
        </Card>

        {/* 액션 버튼 */}
        <div className="space-y-3">
          <Button
            onClick={() => router.push('/')}
            size="lg"
            className="w-full"
          >
            메인으로 돌아가기
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

