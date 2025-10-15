'use client';

import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

type SearchErrorProps = {
  error: string;
  onRetry: () => void;
};

export default function SearchError({ error, onRetry }: SearchErrorProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-red-50 rounded-lg">
      <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        검색 중 오류가 발생했습니다
      </h3>
      <p className="text-sm text-gray-600 mb-4 max-w-md">
        {error}
      </p>
      <Button onClick={onRetry} variant="outline">
        <RefreshCw className="w-4 h-4 mr-2" />
        다시 시도
      </Button>
    </div>
  );
}

