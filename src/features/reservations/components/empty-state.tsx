'use client';

import React from 'react';
import { SearchX } from 'lucide-react';
import { EMPTY_STATE_MESSAGES } from '../constants/search';

export default function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <SearchX className="w-16 h-16 text-gray-400 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {EMPTY_STATE_MESSAGES.TITLE}
      </h3>
      <p className="text-sm text-gray-600 max-w-md">
        {EMPTY_STATE_MESSAGES.DESCRIPTION}
      </p>
    </div>
  );
}

