import { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

export default function Card({ 
  children, 
  className = '', 
  padding = 'md',
  shadow = 'md',
  hover = false 
}: CardProps) {
  const paddingStyles = {
    none: '',
    sm: 'p-3',
    md: 'p-6',
    lg: 'p-8',
  };
  
  const shadowStyles = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
  };
  
  const hoverStyles = hover ? 'hover:shadow-xl transition-shadow duration-300' : '';
  
  return (
    <div className={`bg-white rounded-lg ${paddingStyles[padding]} ${shadowStyles[shadow]} ${hoverStyles} ${className}`}>
      {children}
    </div>
  );
}

