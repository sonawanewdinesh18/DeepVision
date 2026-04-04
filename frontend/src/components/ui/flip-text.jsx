import React from 'react';
import { motion } from 'framer-motion';
import './flip-text.css';

export const FlipText = ({ 
  children, 
  className = '', 
  duration = 2.2, 
  delay = 0 
}) => {
  const text = String(children);
  
  return (
    <span className={`flip-text-container ${className}`}>
      {text.split('').map((char, index) => (
        <span
          key={index}
          className="flip-char"
          data-char={char}
          style={{
            '--flip-duration': `${duration}s`,
            '--flip-delay': `${delay + index * 0.05}s`,
          }}
        >
          {char}
        </span>
      ))}
    </span>
  );
};
