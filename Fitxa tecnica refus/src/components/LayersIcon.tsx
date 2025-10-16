import React from 'react';

export function LayersIcon({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Capa inferior */}
      <rect
        x="2"
        y="4"
        width="10"
        height="8"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        opacity="0.6"
      />
      
      {/* Capa superior */}
      <rect
        x="4"
        y="2"
        width="10"
        height="8"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}