import * as React from 'react';
import { cn } from '../lib/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const inputId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-ink/75">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-12 w-full rounded-md border border-border bg-white px-4 text-[15px] text-ink placeholder:text-ink/35',
            'outline-none transition-colors duration-200',
            'focus:border-brand-orange/70 focus:ring-1 focus:ring-brand-orange/30',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
          {...props}
        />
        {error ? (
          <span id={`${inputId}-error`} className="text-xs text-red-600">
            {error}
          </span>
        ) : hint ? (
          <span id={`${inputId}-hint`} className="text-xs text-ink/40">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, id, className, ...props }, ref) => {
    const textareaId = id ?? React.useId();
    return (
      <div className="flex flex-col gap-2">
        {label && (
          <label htmlFor={textareaId} className="text-sm font-medium text-ink/75">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          className={cn(
            'min-h-[140px] w-full resize-y rounded-md border border-border bg-white px-4 py-3 text-[15px] text-ink placeholder:text-ink/35',
            'outline-none transition-colors duration-200',
            'focus:border-brand-orange/70 focus:ring-1 focus:ring-brand-orange/30',
            error && 'border-red-500/70 focus:border-red-500 focus:ring-red-500/30',
            className,
          )}
          aria-invalid={!!error}
          aria-describedby={error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined}
          {...props}
        />
        {error ? (
          <span id={`${textareaId}-error`} className="text-xs text-red-600">
            {error}
          </span>
        ) : hint ? (
          <span id={`${textareaId}-hint`} className="text-xs text-ink/40">
            {hint}
          </span>
        ) : null}
      </div>
    );
  },
);
Textarea.displayName = 'Textarea';
