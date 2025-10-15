'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';
import type { ReservationDetailResponse } from '../../lib/dto';
import { DIALOG_MESSAGES } from '../../constants/detail';

type CancelDialogProps = {
  open: boolean;
  reservation: ReservationDetailResponse | null;
  seatsSummary: string | null;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function CancelDialog({
  open,
  reservation,
  seatsSummary,
  onConfirm,
  onCancel,
}: CancelDialogProps) {
  if (!open || !reservation) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <Card className="max-w-md w-full mx-4 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <AlertTriangle className="w-6 h-6 text-yellow-500" />
          <h3 className="text-xl font-bold">{DIALOG_MESSAGES.CANCEL_TITLE}</h3>
        </div>

        <div className="mb-4 space-y-2 text-gray-700">
          <p>
            <strong>콘서트:</strong> {reservation.concertTitle}
          </p>
          <p>
            <strong>좌석:</strong> {seatsSummary}
          </p>
        </div>

        <p className="text-sm text-red-600 mb-6">{DIALOG_MESSAGES.CANCEL_DESCRIPTION}</p>

        <div className="flex space-x-4">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            {DIALOG_MESSAGES.CANCEL_CANCEL}
          </Button>
          <Button variant="destructive" onClick={onConfirm} className="flex-1">
            {DIALOG_MESSAGES.CANCEL_CONFIRM}
          </Button>
        </div>
      </Card>
    </div>
  );
}

