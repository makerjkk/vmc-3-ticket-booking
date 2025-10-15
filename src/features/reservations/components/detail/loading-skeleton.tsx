'use client';

import React from 'react';
import { Card } from '@/components/ui/card';

export default function LoadingSkeleton() {
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6">
        <div className="h-8 w-48 bg-gray-200 animate-pulse rounded" />
      </div>

      <Card className="p-6">
        <div className="space-y-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="flex items-center space-x-4">
              <div className="h-5 w-24 bg-gray-200 animate-pulse rounded" />
              <div className="h-5 flex-1 bg-gray-200 animate-pulse rounded" />
            </div>
          ))}
        </div>

        <div className="mt-6 flex space-x-4">
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
          <div className="h-10 w-32 bg-gray-200 animate-pulse rounded" />
        </div>
      </Card>
    </div>
  );
}

