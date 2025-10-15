'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

type ErrorViewProps = {
  error: string;
  onRetry: () => void;
};

export default function ErrorView({ error, onRetry }: ErrorViewProps) {
  const router = useRouter();

  const handleBackToList = () => {
    router.push('/reservations');
  };

  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <Card className="p-12 text-center">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2 text-gray-800">오류가 발생했습니다</h2>
        <p className="text-gray-600 mb-6">{error}</p>

        <div className="flex justify-center space-x-4">
          <Button variant="outline" onClick={handleBackToList}>
            목록으로 돌아가기
          </Button>
          <Button onClick={onRetry}>다시 시도</Button>
        </div>
      </Card>
    </div>
  );
}

