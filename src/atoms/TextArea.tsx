import { TextareaHTMLAttributes, forwardRef } from 'react';

interface TextAreaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  labelClassName?: string;
  textClassName?: string;
  error?: string;
  helperText?: string;
  fullWidth?: boolean;
}

const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(
  ({ label, labelClassName, textClassName, error, helperText, fullWidth = false, className = '', rows = 4, ...props }, ref) => {
    const baseStyles = 'px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 resize-none backdrop-blur-sm bg-white/5';
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
        <textarea
          ref={ref}
          rows={rows}
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

TextArea.displayName = 'TextArea';

export default TextArea;

