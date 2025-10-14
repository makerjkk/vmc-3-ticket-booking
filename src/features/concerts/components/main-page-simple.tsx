'use client';

import React from 'react';
import { ConcertListProvider } from '@/features/concerts/context/concert-list-context-simple';
import { ConcertListSimple } from './concert-list-simple';
import { NavigationBar } from '@/components/layout/navigation-bar';

// 메인 페이지 내부 컴포넌트 (Context 내부에서 사용)
function MainPageContent() {
  return (
    <div className="min-h-screen bg-background" style={{ backgroundColor: '#0D0E24' }}>
      {/* 네비게이션 바 */}
      <NavigationBar />

      {/* 헤더 섹션 */}
      <header className="pt-16" style={{ backgroundColor: '#0D0E24' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center spacing-lg">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                콘서트 예매
              </span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              혁신적이고 미래지향적인 예매 경험을 제공합니다. 
              <span className="text-secondary font-medium"> 90초 안에</span> 원하는 좌석을 확보하세요.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                실시간 좌석 현황
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-secondary rounded-full animate-pulse"></div>
                초고속 예매 시스템
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pb-16">
        <ConcertListSimple />
      </main>

      {/* 푸터 */}
      <footer className="bg-card border-t border-border" style={{ backgroundColor: '#1F2937' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center spacing-md">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="w-6 h-6 rounded-lg bg-white border border-gray-300 flex items-center justify-center">
                <span className="text-gray-900 text-sm font-bold">C</span>
              </div>
              <span className="text-lg font-semibold text-white">콘서트 예매</span>
            </div>
            <p className="text-sm text-gray-400">
              © 2025 콘서트 예매 시스템. All rights reserved.
            </p>
            <p className="text-sm text-gray-300 mt-2">
              문의사항이 있으시면 고객센터 
              <span className="text-blue-400 font-medium"> 1588-0000</span>으로 연락주세요.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// 메인 페이지 컴포넌트 (Provider로 감싸진 버전)
export function MainPageSimple() {
  return (
    <ConcertListProvider>
      <MainPageContent />
    </ConcertListProvider>
  );
}
