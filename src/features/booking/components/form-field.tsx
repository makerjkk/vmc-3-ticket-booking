'use client';

import React, { memo, type InputHTMLAttributes } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  required?: boolean;
  error?: string | null;
  isValid?: boolean;
  hint?: string;
}

export const FormField = memo<FormFieldProps>(
  ({ label, required = false, error, isValid, hint, className, ...inputProps }) => {
    const inputId = `field-${inputProps.name}`;
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;

    return (
      <div className="space-y-2.5">
        <Label 
          htmlFor={inputId} 
          className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="text-red-500 dark:text-red-400 text-base">*</span>}
        </Label>

        <div className="relative">
          <Input
            id={inputId}
            className={cn(
              'h-11 text-base transition-all duration-200',
              'bg-white dark:bg-gray-800',
              'border-2 border-gray-300 dark:border-gray-700',
              'focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:focus:ring-blue-900',
              'placeholder:text-gray-400 dark:placeholder:text-gray-500',
              'text-gray-900 dark:text-gray-100',
              error && 'border-red-500 dark:border-red-400 focus:border-red-500 focus:ring-red-200 dark:focus:ring-red-900 bg-red-50 dark:bg-red-900/10',
              isValid && 'border-green-500 dark:border-green-400 focus:border-green-500 focus:ring-green-200 dark:focus:ring-green-900 bg-green-50 dark:bg-green-900/10',
              className
            )}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, hint && hintId)}
            {...inputProps}
          />

          {/* 검증 아이콘 */}
          {isValid && (
            <CheckCircle2
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-600 dark:text-green-400"
              aria-label="입력 유효"
            />
          )}

          {error && (
            <XCircle
              className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-red-600 dark:text-red-400"
              aria-label="입력 오류"
            />
          )}
        </div>

        {/* 힌트 메시지 */}
        {hint && !error && (
          <p id={hintId} className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
            <span className="inline-block w-1 h-1 rounded-full bg-gray-400"></span>
            {hint}
          </p>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p id={errorId} className="text-sm font-medium text-red-700 dark:text-red-300 flex items-start gap-1.5" role="alert">
            <XCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

