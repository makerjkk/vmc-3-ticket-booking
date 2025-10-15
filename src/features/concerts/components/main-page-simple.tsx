'use client';

import React from 'react';
import { ConcertListProvider } from '@/features/concerts/context/concert-list-context-simple';
import { ConcertListSimple } from './concert-list-simple';
import { NavigationBar } from '@/components/layout/navigation-bar';

// 메인 페이지 내부 컴포넌트 (Context 내부에서 사용)
function MainPageContent() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#ffffff' }}>
      {/* 네비게이션 바 */}
      <NavigationBar />

      {/* 헤더 섹션 */}
      <header className="pt-16" style={{ backgroundColor: '#ffffff' }}>
        <div className="container mx-auto px-4 py-12">
          <div className="text-center spacing-lg">
            <h1 
              className="text-4xl md:text-5xl font-bold mb-4"
              style={{ color: '#1e293b' }}
            >
              콘서트 예매
            </h1>
            <p 
              className="text-lg max-w-3xl mx-auto leading-relaxed"
              style={{ color: '#64748b' }}
            >
              혁신적이고 미래지향적인 예매 경험을 제공합니다. 
              <span 
                className="font-medium"
                style={{ color: '#3b82f6' }}
              > 90초 안에</span> 원하는 좌석을 확보하세요.
            </p>
            <div className="flex items-center justify-center gap-4 mt-6">
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: '#64748b' }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#3b82f6' }}></div>
                실시간 좌석 현황
              </div>
              <div 
                className="flex items-center gap-2 text-sm"
                style={{ color: '#64748b' }}
              >
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: '#10b981' }}></div>
                초고속 예매 시스템
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* 메인 콘텐츠 */}
      <main className="pb-16" style={{ backgroundColor: '#ffffff' }}>
        <ConcertListSimple />
      </main>

      {/* 푸터 */}
      <footer 
        className="border-t"
        style={{ 
          backgroundColor: '#f8fafc',
          borderColor: '#e2e8f0'
        }}
      >
        <div className="container mx-auto px-4 py-12">
          <div className="text-center spacing-md">
            <div className="flex items-center justify-center gap-2 mb-4">
              <div 
                className="w-6 h-6 rounded-lg flex items-center justify-center"
                style={{ 
                  backgroundColor: '#ffffff',
                  border: '2px solid #e2e8f0'
                }}
              >
                <span 
                  className="text-sm font-bold"
                  style={{ color: '#1e293b' }}
                >
                  C
                </span>
              </div>
              <span 
                className="text-lg font-semibold"
                style={{ color: '#1e293b' }}
              >
                콘서트 예매
              </span>
            </div>
            <p 
              className="text-sm"
              style={{ color: '#94a3b8' }}
            >
              © 2025 콘서트 예매 시스템. All rights reserved.
            </p>
            <p 
              className="text-sm mt-2"
              style={{ color: '#64748b' }}
            >
              문의사항이 있으시면 고객센터 
              <span 
                className="font-medium"
                style={{ color: '#3b82f6' }}
              > 1588-0000</span>으로 연락주세요.
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
