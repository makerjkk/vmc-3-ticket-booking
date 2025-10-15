'use client';

import React from 'react';
import Link from 'next/link';
import { Music } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavigationBarProps {
  className?: string;
}

export function NavigationBar({ className }: NavigationBarProps) {
  return (
    <nav
      className={cn(
        'fixed top-0 left-0 right-0 z-50',
        'h-16 bg-background/95 backdrop-blur-sm',
        'border-b border-border',
        'px-4 md:px-6',
        className
      )}
      style={{ backgroundColor: 'rgba(13, 14, 36, 0.95)' }}
    >
      <div className="flex h-full max-w-7xl mx-auto items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-gray-200">
              <Music className="w-5 h-5 text-gray-900" />
            </div>
            <span className="text-lg font-semibold text-white">
              콘서트 예매
            </span>
          </Link>
        </div>

        {/* 중앙 메뉴 */}
        <div className="hidden md:flex items-center gap-8">
          <Link
            href="/reservations"
            className="text-lg font-bold text-white hover:text-gray-300 transition-colors"
            style={{ fontSize: '1.125rem', fontWeight: '700' }}
          >
            예약 확인
          </Link>
        </div>
      </div>
    </nav>
  );
}
