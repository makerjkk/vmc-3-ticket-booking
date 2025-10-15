'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

type CancelWarningProps = {
  reason: string;
};

export default function CancelWarning({ reason }: CancelWarningProps) {
  return (
    <Card className="p-4 bg-yellow-50 border-yellow-200">
      <div className="flex items-start space-x-3">
        <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
        <div>
          <h4 className="font-semibold text-yellow-800 mb-1">예약 취소 불가</h4>
          <p className="text-sm text-yellow-700">{reason}</p>
        </div>
      </div>
    </Card>
  );
}

