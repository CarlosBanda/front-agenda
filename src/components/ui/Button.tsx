import React from 'react';

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'contrast' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  style?: React.CSSProperties;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
  style,
}) => {
  const sizeStyles: Record<string, React.CSSProperties> = {
    sm: { padding: '0.4rem 1rem', fontSize: '0.85rem' },
    md: { padding: '0.6rem 1.5rem', fontSize: '0.95rem' },
    lg: { padding: '0.8rem 2rem', fontSize: '1.1rem' },
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    primary: {
      background: 'linear-gradient(135deg, #e91e8c, #9c27b0)',
      color: '#ffffff',
      border: 'none',
    },
    secondary: {
      background: 'transparent',
      color: '#e91e8c',
      border: '2px solid #e91e8c',
    },
    contrast: {
      background: '#ffffff',
      color: '#172033',
      border: '1px solid rgba(255, 255, 255, 0.72)',
      boxShadow: '0 12px 30px rgba(23, 32, 51, 0.28)',
    },
    danger: {
      background: '#dc2626',
      color: '#ffffff',
      border: 'none',
    },
  };

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    borderRadius: '10px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: disabled ? 0.5 : 1,
    width: fullWidth ? '100%' : 'auto',
    boxShadow: variant === 'primary' ? '0 4px 15px rgba(233, 30, 140, 0.3)' : 'none',
    ...sizeStyles[size],
    ...variantStyles[variant],
    ...style,
  };

  return (
    <button
      type={type}
      className={className}
      style={baseStyle}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

export default Button;
