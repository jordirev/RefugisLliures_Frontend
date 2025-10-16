import React from 'react';
import imgCompassIcon from "figma:asset/64ff35d4c1705d63f3735bb879627eecf1aea4db.png";

interface CompassIconProps {
  className?: string;
}

export function CompassIcon({ className }: CompassIconProps) {
  return (
    <div className={`relative w-12 h-12 ${className}`}>
      {/* Círculo de fondo blanco */}
      <div className="absolute inset-0 bg-white rounded-full border border-gray-200 shadow-lg" />
      
      {/* Imagen de la brújula */}
      <div className="absolute inset-0.5 rounded-full overflow-hidden flex items-center justify-center">
        <img
          alt="Compass"
          className="w-full h-full object-cover"
          src={imgCompassIcon}
        />
      </div>
    </div>
  );
}