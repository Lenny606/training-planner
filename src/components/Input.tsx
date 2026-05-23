import React from 'react';

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  size = 'md',
  id,
  type = 'text',
  ...props
}) => {
  const generatedId = React.useId();
  const inputId = id || generatedId;

  // Size classes for the actual input box
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-lg',
    md: 'px-4 py-2.5 text-xs rounded-xl',
    lg: 'px-5 py-3.5 text-sm rounded-2xl'
  };

  // Base state classes for the input
  const baseInputClasses = 'w-full bg-[#0a0c10] text-[#f3f6f9] border outline-none font-sans placeholder-[#8292a6]/50 focus:shadow-[0_0_12px_rgba(0,242,254,0.1)] transition-all duration-300';
  
  // Dynamic border & outline colors based on success/error/focus states
  const borderClasses = error 
    ? 'border-rose-500/50 focus:border-rose-500 focus:shadow-[0_0_12px_rgba(239,68,68,0.12)]' 
    : 'border-white/5 focus:border-[#00f2fe]/40';

  // Extra padding if icons are present
  const iconPaddingClasses = `
    ${leftIcon ? 'pl-10' : ''} 
    ${rightIcon ? 'pr-10' : ''}
  `;

  return (
    <div className={`flex flex-col gap-1.5 w-full ${containerClassName}`}>
      {label && (
        <label 
          htmlFor={inputId} 
          className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[#8292a6] font-outfit"
        >
          {label}
        </label>
      )}

      <div className="relative flex items-center w-full">
        {leftIcon && (
          <div className="absolute left-3.5 text-[#8292a6]/60 pointer-events-none flex items-center justify-center shrink-0">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          type={type}
          className={`${baseInputClasses} ${borderClasses} ${sizeClasses[size]} ${iconPaddingClasses} ${className}`}
          {...props}
        />

        {rightIcon && (
          <div className="absolute right-3.5 text-[#8292a6]/60 pointer-events-none flex items-center justify-center shrink-0">
            {rightIcon}
          </div>
        )}
      </div>

      {error ? (
        <span className="text-[10px] text-rose-400 font-semibold tracking-wide mt-0.5">
          {error}
        </span>
      ) : helperText ? (
        <span className="text-[10px] text-[#8292a6]/70 mt-0.5">
          {helperText}
        </span>
      ) : null}
    </div>
  );
};
