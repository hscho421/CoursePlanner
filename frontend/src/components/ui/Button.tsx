import { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface BaseButtonProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: ReactNode;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  className?: string;
}

type ButtonAsButton = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof BaseButtonProps> & {
    as?: 'button';
  };

type ButtonAsLink = BaseButtonProps &
  Omit<LinkProps, keyof BaseButtonProps> & {
    as: 'link';
  };

type ButtonProps = ButtonAsButton | ButtonAsLink;

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm',
  secondary:
    'bg-white text-blue-600 border border-blue-200 hover:bg-blue-50 active:bg-blue-100',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm rounded-md gap-1.5',
  md: 'px-4 py-2 text-sm rounded-lg gap-2',
  lg: 'px-6 py-3 text-base rounded-xl gap-2',
};

export function Button(props: ButtonProps) {
  const {
    variant = 'primary',
    size = 'md',
    children,
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    ...rest
  } = props;

  const baseClasses = `
    inline-flex items-center justify-center
    font-medium transition-all duration-150
    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${className}
  `;

  if (props.as === 'link') {
    const { as, ...linkProps } = rest as Omit<ButtonAsLink, keyof BaseButtonProps>;
    return (
      <Link className={baseClasses} {...(linkProps as Omit<LinkProps, 'className'>)}>
        {leftIcon}
        {children}
        {rightIcon}
      </Link>
    );
  }

  const { as, disabled, ...buttonProps } = rest as Omit<ButtonAsButton, keyof BaseButtonProps>;
  return (
    <button
      className={baseClasses}
      disabled={disabled || isLoading}
      {...buttonProps}
    >
      {isLoading ? (
        <span className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
      ) : (
        leftIcon
      )}
      {children}
      {!isLoading && rightIcon}
    </button>
  );
}
