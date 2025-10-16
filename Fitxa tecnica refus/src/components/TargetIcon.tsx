import React from 'react';

export function TargetIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Círculo exterior */}
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      
      {/* Círculo central */}
      <circle
        cx="12"
        cy="12"
        r="1.5"
        fill="currentColor"
      />
      
      {/* Línea superior */}
      <line
        x1="12"
        y1="2.5"
        x2="12"
        y2="6.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Línea derecha */}
      <line
        x1="21.5"
        y1="12"
        x2="17.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Línea inferior */}
      <line
        x1="12"
        y1="21.5"
        x2="12"
        y2="17.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      
      {/* Línea izquierda */}
      <line
        x1="2.5"
        y1="12"
        x2="6.5"
        y2="12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}