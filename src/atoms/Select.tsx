import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  labelClassName?: string;
  textClassName?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, labelClassName, textClassName, error, options, placeholder, fullWidth = false, className = '', ...props }, ref) => {
    const baseStyles = 'px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 transition-all duration-200 backdrop-blur-sm bg-white/5 text-white';
    const errorStyles = error 
      ? 'border-red-500/50 focus:ring-red-500/50 focus:border-red-500' 
      : 'border-white/10 focus:ring-blue-500/50 focus:border-blue-500 hover:border-white/20';
    const widthStyles = fullWidth ? 'w-full' : '';
    const textStyles = textClassName ?? 'text-white';
    
    return (
      <div className={`${fullWidth ? 'w-full' : ''}`}>
        {label && (
          <label className={`block text-sm font-medium mb-2 ${labelClassName ?? 'text-gray-300'}`}>
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`${baseStyles} ${errorStyles} ${widthStyles} ${textStyles} ${className}`}
          {...props}
        >
          {placeholder && (
            <option value="" disabled className="bg-gray-900">
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-gray-900">
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-2 text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export default Select;

