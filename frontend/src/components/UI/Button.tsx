import { ButtonHTMLAttributes } from 'react';
import clsx from 'clsx';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white border-emerald-500 shadow-emerald-900/30',
  secondary: 'bg-slate-700 hover:bg-slate-600 active:bg-slate-800 text-slate-100 border-slate-600 shadow-slate-900/30',
  danger: 'bg-red-600 hover:bg-red-500 active:bg-red-700 text-white border-red-500 shadow-red-900/30',
  ghost: 'bg-transparent hover:bg-slate-700/50 text-slate-300 border-slate-600/50',
  success: 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white border-blue-500 shadow-blue-900/30',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-5 py-2.5 text-base',
  lg: 'px-7 py-3.5 text-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  children,
  className,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-lg border font-semibold',
        'transition-all duration-150 shadow-md',
        'focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:ring-offset-2 focus:ring-offset-slate-900',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading && (
        <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      )}
      {children}
    </button>
  );
}
