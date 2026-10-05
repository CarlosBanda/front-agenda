import React, { useState } from 'react';

interface CardProps {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: () => void;
}

const Card: React.FC<CardProps> = ({ children, style, onClick }) => {
  const [hovered, setHovered] = useState(false);

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: hovered
      ? '0 8px 30px rgba(233, 30, 140, 0.15)'
      : '0 4px 15px rgba(0, 0, 0, 0.06)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
    transform: hovered ? 'translateY(-2px)' : 'translateY(0)',
    cursor: onClick ? 'pointer' : 'default',
    ...style,
  };

  return (
    <div
      style={cardStyle}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {children}
    </div>
  );
};

export default Card;
