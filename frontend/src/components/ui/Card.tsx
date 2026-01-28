import { type ReactNode } from 'react';

type CardVariant = 'default' | 'glass' | 'gradient' | 'elevated';

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
  variant?: CardVariant;
}

const paddingStyles = {
  none: '',
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

const variantStyles: Record<CardVariant, string> = {
  default: 'bg-white border border-slate-200/80 shadow-sm',
  glass: 'bg-white/70 backdrop-blur-sm border border-white/50 shadow-sm',
  gradient: 'bg-gradient-to-br from-white to-blue-50/50 border border-blue-100/50 shadow-sm',
  elevated: 'bg-white border border-slate-100 shadow-md',
};

export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  variant = 'default',
}: CardProps) {
  return (
    <div
      className={`
        rounded-xl
        ${variantStyles[variant]}
        ${hover ? 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5' : ''}
        ${paddingStyles[padding]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`pb-4 border-b border-slate-100 ${className}`}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <h3 className={`text-lg font-semibold text-slate-800 ${className}`}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</p>
  );
}

export function CardContent({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`pt-4 ${className}`}>{children}</div>;
}
