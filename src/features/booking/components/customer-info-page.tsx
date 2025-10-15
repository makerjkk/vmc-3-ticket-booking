'use client';

import React, { memo, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Clock, User, Phone, Mail } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Seat } from '../lib/dto';

// 고객 정보 입력 폼 스키마
const customerInfoSchema = z.object({
  name: z
    .string()
    .min(2, '이름은 2자 이상 입력해주세요')
    .max(50, '이름은 50자 이하로 입력해주세요')
    .regex(/^[가-힣a-zA-Z\s]+$/, '이름에는 한글, 영문, 공백만 사용할 수 있습니다'),
  phone: z
    .string()
    .regex(/^010-\d{4}-\d{4}$/, '휴대폰 번호는 010-XXXX-XXXX 형식으로 입력해주세요'),
  email: z
    .string()
    .email('올바른 이메일 형식을 입력해주세요')
    .optional()
    .or(z.literal('')),
});

type CustomerInfoFormData = z.infer<typeof customerInfoSchema>;

interface CustomerInfoPageProps {
  concertId: string;
  scheduleId: string;
  seatIds: string[];
  className?: string;
}

interface BookingSummary {
  concertTitle: string;
  scheduleDate: string;
  scheduleTime: string;
  venue: string;
  seats: Seat[];
  totalPrice: number;
  holdExpiry: number; // 임시 홀드 만료 시간 (timestamp)
}

export const CustomerInfoPage = memo<CustomerInfoPageProps>(({
  concertId,
  scheduleId,
  seatIds,
  className,
}) => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [bookingSummary, setBookingSummary] = useState<BookingSummary | null>(null);
  const [holdTimeRemaining, setHoldTimeRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  // React Hook Form 설정
  const form = useForm<CustomerInfoFormData>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
      name: '',
      phone: '',
      email: '',
    },
  });

  // 예약 정보 로드
  useEffect(() => {
    const loadBookingSummary = () => {
      setIsLoading(true);
      setError(null);

      // 좌석 정보와 콘서트 정보를 동시에 가져오기
      Promise.all([
        fetch(`/api/schedules/${scheduleId}/seats/summary`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ seatIds }),
        }),
        fetch(`/api/concerts/${concertId}/schedule/${scheduleId}`),
      ])
        .then(([seatsResponse, concertResponse]) => {

          if (!seatsResponse.ok) {
            throw new Error('선택한 좌석 정보를 불러올 수 없습니다');
          }

          if (!concertResponse.ok) {
            throw new Error('콘서트 정보를 불러올 수 없습니다');
          }

          return Promise.all([seatsResponse.json(), concertResponse.json()]);
        })
        .then(([seatsData, concertData]) => {
          // 좌석이 여전히 예약 가능한지 확인
          const unavailableSeats = seatsData.seats?.filter((seat: Seat) => seat.status !== 'available') || [];
          
          if (unavailableSeats.length > 0) {
            throw new Error('선택한 좌석 중 일부가 이미 예약되었습니다. 좌석을 다시 선택해주세요.');
          }

          const summary: BookingSummary = {
            concertTitle: concertData.concert?.title || '콘서트',
            scheduleDate: concertData.schedule?.date || '',
            scheduleTime: concertData.schedule?.time || '',
            venue: concertData.concert?.venue || '',
            seats: seatsData.seats || [],
            totalPrice: seatsData.totalPrice || 0,
            holdExpiry: Date.now() + (5 * 60 * 1000), // 5분 후 만료
          };

          setBookingSummary(summary);
          setHoldTimeRemaining(5 * 60); // 5분 = 300초
          setIsLoading(false);
        })
        .catch(error => {
          const errorMessage = error instanceof Error ? error.message : '예약 정보를 불러오는 중 오류가 발생했습니다';
          setError(errorMessage);
          console.error('Failed to load booking summary:', error);
          setIsLoading(false);
        });
    };

    loadBookingSummary();
  }, [concertId, scheduleId, seatIds]);

  // 홀드 시간 카운트다운
  useEffect(() => {
    if (!bookingSummary) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.floor((bookingSummary.holdExpiry - Date.now()) / 1000));
      setHoldTimeRemaining(remaining);

      if (remaining === 0) {
        setError('좌석 선택 시간이 만료되었습니다. 처음부터 다시 시작해주세요.');
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [bookingSummary]);

  // 폼 제출 핸들러
  const onSubmit = (data: CustomerInfoFormData) => {
    if (!bookingSummary) return;

    setIsLoading(true);
    setError(null);

    // 예약 생성 API 호출
    fetch('/api/reservations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        concertId,
        scheduleId,
        seatIds,
        customerInfo: {
          name: data.name,
          phone: data.phone,
          email: data.email || null,
        },
      }),
    })
      .then(response => {
        if (!response.ok) {
          return response.json().then(errorData => {
            throw new Error(errorData.message || '예약 처리 중 오류가 발생했습니다');
          });
        }
        return response.json();
      })
      .then(result => {
        // 예약 완료 페이지로 이동
        router.push(`/booking/${concertId}/complete?reservationId=${result.reservationId}`);
      })
      .catch(error => {
        const errorMessage = error instanceof Error ? error.message : '예약 처리 중 오류가 발생했습니다';
        setError(errorMessage);
        console.error('Reservation failed:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // 휴대폰 번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 시간 포맷팅 (MM:SS)
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // 가격 포맷팅
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(price);
  };

  // 좌석 번호 포맷팅
  const formatSeatNumber = (seat: Seat) => {
    return `${seat.rowName}열 ${seat.seatIndex}번`;
  };

  // 로딩 상태
  if (isLoading && !bookingSummary) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">예약 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 에러 상태
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">오류가 발생했습니다</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="space-x-4">
            <Button
              onClick={() => router.back()}
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              이전으로
            </Button>
            <Button
              onClick={() => router.push(`/booking/${concertId}`)}
            >
              처음부터 다시
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!bookingSummary) {
    return null;
  }

  return (
    <div className={cn('min-h-screen bg-gray-50', className)}>
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* 헤더 */}
        <div className="mb-6">
          <Button
            onClick={() => router.back()}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            이전으로
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            예약자 정보 입력
          </h1>
          <p className="text-gray-600">
            예약을 완료하기 위해 예약자 정보를 입력해주세요
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 예약자 정보 입력 폼 */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  예약자 정보
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    {/* 이름 */}
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            이름 <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="홍길동"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 휴대폰 번호 */}
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            휴대폰 번호 <span className="text-red-500">*</span>
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="010-1234-5678"
                              {...field}
                              onChange={(e) => {
                                const formatted = formatPhoneNumber(e.target.value);
                                field.onChange(formatted);
                              }}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 이메일 */}
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            이메일 (선택사항)
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="example@email.com"
                              {...field}
                              disabled={isLoading}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* 제출 버튼 */}
                    <div className="pt-4">
                      <Button
                        type="submit"
                        className="w-full"
                        disabled={isLoading || holdTimeRemaining === 0}
                      >
                        {isLoading ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            예약 처리 중...
                          </>
                        ) : (
                          '예약 확정'
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>

          {/* 예약 요약 정보 */}
          <div className="space-y-4">
            {/* 시간 제한 알림 */}
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-amber-800 mb-2">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">좌석 선택 시간</span>
                </div>
                <div className="text-2xl font-bold text-amber-900">
                  {formatTime(holdTimeRemaining)}
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  시간 초과 시 좌석 선택이 해제됩니다
                </p>
              </CardContent>
            </Card>

            {/* 예약 정보 요약 */}
            <Card>
              <CardHeader>
                <CardTitle>예약 정보</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 콘서트 정보 */}
                <div>
                  <h3 className="font-medium text-gray-900 mb-1">
                    {bookingSummary.concertTitle}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {bookingSummary.venue}
                  </p>
                </div>

                <Separator />

                {/* 일시 */}
                <div>
                  <p className="text-sm text-gray-600 mb-1">공연 일시</p>
                  <p className="font-medium">
                    {bookingSummary.scheduleDate} {bookingSummary.scheduleTime}
                  </p>
                </div>

                <Separator />

                {/* 선택된 좌석 */}
                <div>
                  <p className="text-sm text-gray-600 mb-2">선택된 좌석</p>
                  <div className="space-y-2">
                    {bookingSummary.seats.map((seat) => (
                      <div key={seat.id} className="flex justify-between items-center">
                        <div>
                          <span className="font-medium">
                            {formatSeatNumber(seat)}
                          </span>
                          <Badge variant="outline" className="ml-2">
                            {seat.grade}석
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">
                          {formatPrice(seat.price)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* 총 결제 금액 */}
                <div className="flex justify-between items-center">
                  <span className="font-medium text-lg">총 결제 금액</span>
                  <span className="font-bold text-xl text-blue-600">
                    {formatPrice(bookingSummary.totalPrice)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
});

CustomerInfoPage.displayName = 'CustomerInfoPage';
