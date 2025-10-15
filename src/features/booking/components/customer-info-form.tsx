'use client';

import React, { memo, type FormEvent } from 'react';
import { FormField } from './form-field';
import type { BookingCompletionState } from '../hooks/use-booking-completion-reducer';
import type { BookingCompletionContextValue } from '../context/booking-completion-context';

interface CustomerInfoFormProps {
  form: BookingCompletionState['form'];
  validation: BookingCompletionState['validation'];
  inputActions: BookingCompletionContextValue['inputActions'];
  onSubmit: (e: FormEvent) => void;
  isSubmitting: boolean;
}

export const CustomerInfoForm = memo<CustomerInfoFormProps>(
  ({ form, validation, inputActions, onSubmit, isSubmitting }) => {
    return (
      <form onSubmit={onSubmit} className="space-y-4">
        {/* 이름 필드 */}
        <FormField
          label="이름"
          required
          name="customerName"
          value={form.customerName}
          error={validation.nameError}
          isValid={validation.isNameValid}
          disabled={isSubmitting}
          placeholder="홍길동"
          onChange={(e) => inputActions.handleNameChange(e.target.value)}
          autoComplete="name"
          autoFocus
          maxLength={50}
          aria-describedby="name-error name-hint"
        />

        {/* 휴대폰 번호 필드 */}
        <FormField
          label="휴대폰 번호"
          required
          name="phoneNumber"
          type="tel"
          value={form.phoneNumber}
          error={validation.phoneError}
          isValid={validation.isPhoneValid}
          disabled={isSubmitting}
          placeholder="010-1234-5678"
          onChange={(e) => inputActions.handlePhoneChange(e.target.value)}
          autoComplete="tel"
          maxLength={13}
          aria-describedby="phone-error phone-hint"
        />

        {/* 이메일 필드 (선택) */}
        <FormField
          label="이메일"
          required={false}
          name="email"
          type="email"
          value={form.email}
          error={validation.emailError}
          isValid={validation.isEmailValid && form.email.length > 0}
          disabled={isSubmitting}
          placeholder="example@domain.com"
          onChange={(e) => inputActions.handleEmailChange(e.target.value)}
          autoComplete="email"
          aria-describedby="email-error email-hint"
          hint="선택 입력 항목입니다"
        />
      </form>
    );
  }
);

CustomerInfoForm.displayName = 'CustomerInfoForm';

