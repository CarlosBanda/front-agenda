import React from 'react';

interface LoadingSpinnerProps {
  size?: number;
  color?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 40,
  color = '#e91e8c',
}) => {
  const styles: Record<string, React.CSSProperties> = {
    container: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
    },
    spinner: {
      width: `${size}px`,
      height: `${size}px`,
      border: `4px solid rgba(233, 30, 140, 0.15)`,
      borderTopColor: color,
      borderRadius: '50%',
      animation: 'glambook-spin 0.8s linear infinite',
    },
  };

  return (
    <div style={styles.container}>
      <div style={styles.spinner} />
      <style>{`
        @keyframes glambook-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default LoadingSpinner;
