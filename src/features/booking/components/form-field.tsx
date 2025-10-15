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
      <div className="space-y-2">
        <Label htmlFor={inputId} className="flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </Label>

        <div className="relative">
          <Input
            id={inputId}
            className={cn(
              className,
              error && 'border-destructive focus-visible:ring-destructive',
              isValid && 'border-green-500 focus-visible:ring-green-500'
            )}
            aria-invalid={!!error}
            aria-describedby={cn(error && errorId, hint && hintId)}
            {...inputProps}
          />

          {/* 검증 아이콘 */}
          {isValid && (
            <CheckCircle2
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500"
              aria-label="입력 유효"
            />
          )}

          {error && (
            <XCircle
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive"
              aria-label="입력 오류"
            />
          )}
        </div>

        {/* 힌트 메시지 */}
        {hint && !error && (
          <p id={hintId} className="text-sm text-muted-foreground">
            {hint}
          </p>
        )}

        {/* 에러 메시지 */}
        {error && (
          <p id={errorId} className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }
);

FormField.displayName = 'FormField';

