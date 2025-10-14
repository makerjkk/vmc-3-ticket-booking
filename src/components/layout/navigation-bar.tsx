'use client';

import React from 'react';
import Link from 'next/link';
import { Music, User, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
            href="/"
            className="text-sm font-medium text-white hover:text-gray-300 transition-colors"
          >
            콘서트
          </Link>
          <Link
            href="/schedules"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            공연 일정
          </Link>
          <Link
            href="/venues"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            공연장
          </Link>
          <Link
            href="/events"
            className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
          >
            이벤트
          </Link>
        </div>

        {/* 우측 유틸리티 */}
        <div className="flex items-center gap-2">
          {/* 검색 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="hidden sm:flex items-center gap-2 text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Search className="w-4 h-4" />
            <span className="text-sm">검색</span>
          </Button>

          {/* 알림 버튼 */}
          <Button
            variant="ghost"
            size="sm"
            className="relative text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <Bell className="w-4 h-4" />
            {/* 알림 배지 */}
            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* 사용자 메뉴 */}
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-300 hover:text-white hover:bg-gray-700"
          >
            <User className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </nav>
  );
}
