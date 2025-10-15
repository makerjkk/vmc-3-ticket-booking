'use client';

import React, { use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  ReservationDetailProvider,
  useReservationDetailContext,
} from '@/features/reservations/context/reservation-detail-context';
import {
  LoadingSkeleton,
  ErrorView,
  ReservationInfo,
  CancelButton,
  CancelDialog,
  CancelWarning,
  SuccessToast,
} from '@/features/reservations/components/detail';
import { SUCCESS_MESSAGES } from '@/features/reservations/constants/detail';

function ReservationDetailContent() {
  const { state, actions, derived } = useReservationDetailContext();
  const router = useRouter();

  const handleBackToList = () => {
    router.push('/reservations');
  };

  if (state.isLoading) {
    return <LoadingSkeleton />;
  }

  if (state.error) {
    return <ErrorView error={state.error} onRetry={actions.retry} />;
  }

  if (!state.reservation) {
    return <ErrorView error="예약 정보를 찾을 수 없습니다" onRetry={actions.retry} />;
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">예약 상세</h1>

      <ReservationInfo reservation={state.reservation} formattedData={derived.formattedData} />

      {!state.canCancel && state.cancelReason && (
        <div className="mt-4">
          <CancelWarning reason={state.cancelReason} />
        </div>
      )}

      <div className="mt-6 flex space-x-4">
        <Button variant="outline" onClick={handleBackToList}>
          목록으로 돌아가기
        </Button>

        {state.canCancel && (
          <CancelButton
            disabled={derived.isCancelButtonDisabled}
            isLoading={state.isCancelling}
            onClick={actions.openCancelDialog}
          />
        )}
      </div>

      <CancelDialog
        open={state.showCancelDialog}
        reservation={state.reservation}
        seatsSummary={derived.formattedData.seatsSummary}
        onConfirm={actions.cancelReservation}
        onCancel={actions.closeCancelDialog}
      />

      <SuccessToast
        message={SUCCESS_MESSAGES.RESERVATION_CANCELLED}
        show={derived.showSuccessToast}
      />
    </div>
  );
}

export default function ReservationDetailPage({
  params,
}: {
  params: Promise<{ reservationId: string }>;
}) {
  const { reservationId } = use(params);

  return (
    <ReservationDetailProvider reservationId={reservationId}>
      <ReservationDetailContent />
    </ReservationDetailProvider>
  );
}

