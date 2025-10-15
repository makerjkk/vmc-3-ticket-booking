'use client';

import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Search } from 'lucide-react';
import { useReservationSearchContext } from '../context/reservation-search-context';
import { PLACEHOLDERS } from '../constants/search';

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
    actions.setContact(e.target.value);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <Label htmlFor="reservationId">예약 번호</Label>
          <Input
            id="reservationId"
            type="text"
            placeholder={PLACEHOLDERS.RESERVATION_ID}
            value={state.searchForm.reservationId}
            onChange={handleReservationIdChange}
            disabled={state.isLoading}
            className={state.validationErrors.reservationId ? 'border-red-500' : ''}
          />
          {state.validationErrors.reservationId && (
            <p className="text-sm text-red-600">{state.validationErrors.reservationId}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="contact">연락처 (휴대폰 또는 이메일)</Label>
          <Input
            id="contact"
            type="text"
            placeholder={PLACEHOLDERS.CONTACT}
            value={state.searchForm.contact}
            onChange={handleContactChange}
            disabled={state.isLoading}
            className={state.validationErrors.contact ? 'border-red-500' : ''}
          />
          {state.validationErrors.contact && (
            <p className="text-sm text-red-600">{state.validationErrors.contact}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={actions.resetForm}
          disabled={state.isLoading}
        >
          초기화
        </Button>
        <Button
          type="submit"
          disabled={state.isLoading}
          className="min-w-[120px]"
        >
          {state.isLoading ? (
            <>
              <span className="animate-spin mr-2">⏳</span>
              검색 중...
            </>
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              조회하기
            </>
          )}
        </Button>
      </div>
    </form>
  );
}

