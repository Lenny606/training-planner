import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  // Base classes for premium active clicking feedback and transition animations
  const baseClasses = 'inline-flex items-center justify-center font-semibold tracking-wide transition-all duration-300 rounded-xl outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#0a0c10] select-none active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100';

  // Variant classes utilizing Tailwind v4 custom themes and gradients
  const variantClasses = {
    primary: 'bg-gradient-to-r from-[#00f2fe] to-[#4facfe] text-[#0a0c10] focus:ring-[#00f2fe]/40 hover:shadow-[0_0_20px_rgba(0,242,254,0.35)]',
    secondary: 'bg-[#1b202c]/65 hover:bg-[#1b202c]/95 text-[#f3f6f9] border border-white/5 hover:border-white/12 focus:ring-white/20',
    accent: 'bg-gradient-to-r from-[#ff5e62] to-[#ff9f43] text-white focus:ring-[#ff5e62]/40 hover:shadow-[0_0_20px_rgba(255,94,98,0.3)]',
    outline: 'bg-transparent text-[#00f2fe] border border-[#00f2fe]/30 hover:bg-[#00f2fe]/10 hover:border-[#00f2fe]/50 focus:ring-[#00f2fe]/20',
    ghost: 'bg-transparent text-[#8292a6] hover:bg-white/5 hover:text-white focus:ring-white/10'
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs font-bold gap-1.5 rounded-lg',
    md: 'px-5 py-2.5 text-xs tracking-wider gap-2',
    lg: 'px-7 py-3.5 text-sm tracking-wider gap-2.5 rounded-2xl'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      disabled={disabled || loading}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${widthClass} ${className}`}
      {...props}
    >
      {loading ? (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon && <span className="flex items-center justify-center shrink-0">{leftIcon}</span>
      )}
      
      <span>{children}</span>
      
      {!loading && rightIcon && (
        <span className="flex items-center justify-center shrink-0">{rightIcon}</span>
      )}
    </button>
  );
};
