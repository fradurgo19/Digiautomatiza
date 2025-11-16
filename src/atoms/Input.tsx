import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelClassName?: string;
  textClassName?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, labelClassName, textClassName, error, helperText, fullWidth = false, className = '', ...props }, ref) => {
    const baseStyles = 'px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm bg-white/5';
    const errorStyles = error 
      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' 
      : 'border-white/10 focus:ring-blue-500/50 focus:border-blue-500 hover:border-white/20';
    const widthStyles = fullWidth ? 'w-full' : '';
    const textColor = textClassName ?? 'text-white placeholder:text-gray-500';
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className={`block text-sm font-medium mb-2 ${labelClassName ?? 'text-gray-300'}`}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${widthStyles} ${textColor} ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-2 text-sm text-gray-400">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export default Input;

