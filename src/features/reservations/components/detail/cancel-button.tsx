'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type CancelButtonProps = {
  disabled: boolean;
  isLoading: boolean;
  onClick: () => void;
};

export default function CancelButton({ disabled, isLoading, onClick }: CancelButtonProps) {
  return (
    <Button
      variant="destructive"
      onClick={onClick}
      disabled={disabled}
      className="w-full sm:w-auto"
    >
      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      {isLoading ? '취소 처리 중...' : '예약 취소하기'}
    </Button>
  );
}

