'use client';

import React, { useEffect } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ToastNotificationProps {
  type: 'success' | 'error' | 'warning';
  message: string;
  onClose: () => void;
  duration?: number;
  position?: 'top' | 'bottom';
}

const toastStyles = {
  success: {
    bg: 'bg-primary',
    text: 'text-primary-foreground',
    icon: CheckCircle,
  },
  error: {
    bg: 'bg-destructive',
    text: 'text-destructive-foreground',
    icon: AlertCircle,
  },
  warning: {
    bg: 'bg-accent',
    text: 'text-accent-foreground',
    icon: AlertTriangle,
  },
};

export function ToastNotification({
  type,
  message,
  onClose,
  duration = 4000,
  position = 'top',
}: ToastNotificationProps) {
  const style = toastStyles[type];
  const Icon = style.icon;

  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        'fixed right-4 z-50 flex items-center gap-3 rounded-xl px-6 py-4 shadow-xl backdrop-blur-sm transition-all duration-300 ease-in-out border',
        style.bg,
        style.text,
        position === 'top' ? 'top-20' : 'bottom-4',
        'animate-in slide-in-from-right-full',
        type === 'success' && 'border-primary/20',
        type === 'error' && 'border-destructive/20',
        type === 'warning' && 'border-accent/20'
      )}
      role="alert"
      aria-live="polite"
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium">{message}</p>
      <button
        type="button"
        onClick={onClose}
        className={cn(
          'ml-2 flex-shrink-0 rounded-full p-1 transition-colors',
          'hover:bg-white/10 focus:bg-white/10 focus:outline-none'
        )}
        aria-label="알림 닫기"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
