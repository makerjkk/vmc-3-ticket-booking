'use client';

import React from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

export default function SearchLoadingSkeleton() {
  return (
    <div className="space-y-4 mb-6">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-2/3 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

