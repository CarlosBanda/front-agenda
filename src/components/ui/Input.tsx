import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: LucideIcon;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  icon: Icon,
  id,
  ...rest
}) => {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

  const styles: Record<string, React.CSSProperties> = {
    wrapper: {
      display: 'flex',
      flexDirection: 'column',
      gap: '0.4rem',
      width: '100%',
    },
    label: {
      fontSize: '0.9rem',
      fontWeight: 600,
      color: '#1a1a2e',
    },
    inputContainer: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center',
    },
    icon: {
      position: 'absolute',
      left: '12px',
      color: '#9ca3af',
      pointerEvents: 'none',
    },
    input: {
      width: '100%',
      padding: Icon ? '0.7rem 1rem 0.7rem 2.5rem' : '0.7rem 1rem',
      fontSize: '0.95rem',
      border: error ? '2px solid #dc2626' : '2px solid #e5e7eb',
      borderRadius: '10px',
      outline: 'none',
      transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
      backgroundColor: '#ffffff',
      color: '#1a1a2e',
      boxSizing: 'border-box',
    },
    error: {
      fontSize: '0.8rem',
      color: '#dc2626',
      marginTop: '0.2rem',
    },
  };

  return (
    <div style={styles.wrapper}>
      {label && (
        <label htmlFor={inputId} style={styles.label}>
          {label}
        </label>
      )}
      <div style={styles.inputContainer}>
        {Icon && (
          <span style={styles.icon}>
            <Icon size={18} />
          </span>
        )}
        <input
          id={inputId}
          style={styles.input}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...rest}
        />
      </div>
      {error && (
        <span id={`${inputId}-error`} style={styles.error} role="alert">
          {error}
        </span>
      )}
    </div>
  );
};

export default Input;
