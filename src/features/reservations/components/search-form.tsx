'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useReservationSearchContext } from '../context/reservation-search-context';
import { PLACEHOLDERS } from '../constants/search';
import { formatPhoneNumber } from '../lib/formatters';

export default function SearchForm() {
  const { state, actions } = useReservationSearchContext();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    actions.search();
  };

  const handleReservationIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    actions.setReservationId(e.target.value);
  };

  const handleContactChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // 이메일 형식인지 확인 (@가 포함되어 있으면 이메일로 간주)
    if (inputValue.includes('@')) {
      // 이메일인 경우 포맷팅 없이 그대로 설정
      actions.setContact(inputValue);
    } else {
      // 전화번호인 경우 자동 포맷팅
      const formattedPhone = formatPhoneNumber(inputValue);
      actions.setContact(formattedPhone);
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      className="rounded-lg shadow-lg p-6 sm:p-8 mb-8"
      style={{ backgroundColor: '#f8fafc' }}
    >
      <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#e0f2fe' }}>
        <p className="text-sm font-medium" style={{ color: '#0369a1' }}>
          💡 예약 번호 또는 연락처(휴대폰/이메일) 중 하나만 입력하면 조회할 수 있습니다.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 relative">
        <div className="space-y-3">
          <Label 
            htmlFor="reservationId"
            className="text-base font-bold"
            style={{ color: '#1e293b' }}
          >
            예약 번호 <span className="text-sm font-normal" style={{ color: '#64748b' }}>(선택)</span>
          </Label>
          <Input
            id="reservationId"
            type="text"
            placeholder={PLACEHOLDERS.RESERVATION_ID}
            value={state.searchForm.reservationId}
            onChange={handleReservationIdChange}
            disabled={state.isLoading}
            className={`h-12 text-base border-2 ${state.validationErrors.reservationId ? 'border-red-500' : ''}`}
            style={{ 
              backgroundColor: '#ffffff',
              borderColor: state.validationErrors.reservationId ? '#ef4444' : '#cbd5e1'
            }}
          />
          {state.validationErrors.reservationId && (
            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
              {state.validationErrors.reservationId}
            </p>
          )}
        </div>

        {/* "또는" 구분자 */}
        <div className="hidden md:flex absolute left-1/2 top-12 -translate-x-1/2 items-center justify-center z-10">
          <div 
            className="px-4 py-2 rounded-full font-bold text-base shadow-md"
            style={{ 
              backgroundColor: '#3b82f6',
              color: '#ffffff'
            }}
          >
            또는
          </div>
        </div>

        {/* 모바일용 "또는" */}
        <div className="md:hidden flex items-center justify-center -my-3">
          <div 
            className="px-4 py-2 rounded-full font-bold text-base shadow-md"
            style={{ 
              backgroundColor: '#3b82f6',
              color: '#ffffff'
            }}
          >
            또는
          </div>
        </div>

        <div className="space-y-3">
          <Label 
            htmlFor="contact"
            className="text-base font-bold"
            style={{ color: '#1e293b' }}
          >
            연락처 (휴대폰 또는 이메일) <span className="text-sm font-normal" style={{ color: '#64748b' }}>(선택)</span>
          </Label>
          <Input
            id="contact"
            type="text"
            placeholder={PLACEHOLDERS.CONTACT}
            value={state.searchForm.contact}
            onChange={handleContactChange}
            disabled={state.isLoading}
            className={`h-12 text-base border-2 ${state.validationErrors.contact ? 'border-red-500' : ''}`}
            style={{ 
              backgroundColor: '#ffffff',
              borderColor: state.validationErrors.contact ? '#ef4444' : '#cbd5e1'
            }}
          />
          {state.validationErrors.contact && (
            <p className="text-sm font-medium" style={{ color: '#dc2626' }}>
              {state.validationErrors.contact}
            </p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-3">
        <Button
          type="button"
          variant="outline"
          onClick={actions.resetForm}
          disabled={state.isLoading}
          className="px-6 py-6 text-base font-bold border-2"
          style={{ 
            borderColor: '#cbd5e1',
            color: '#475569'
          }}
        >
          초기화
        </Button>
        <Button
          type="submit"
          disabled={state.isLoading}
          className="min-w-[140px] px-6 py-6 text-base font-bold"
          style={{
            backgroundColor: '#2563eb',
            color: '#ffffff'
          }}
        >
          {state.isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              검색 중...
            </>
          ) : (
            <>
              <Search className="w-5 h-5 mr-2" />
              조회하기
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

