import React, { useMemo } from 'react';
import logoSrc from '../assets/logo.png'; 

const BackgroundHorses = () => {
  const horses = useMemo(() => {
    return [...Array(15)].map((_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      width: `${50 + Math.random() * 100}px`,
      animationDuration: `${15 + Math.random() * 20}s`,
      animationDelay: `${Math.random() * -20}s`,
      opacity: 0.1 + Math.random() * 0.3
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none w-full h-full">
      {horses.map((horse) => (
        <img
          key={horse.id}
          src={logoSrc}
          alt=""
          className="horse-float filter grayscale-0"
          style={{
            left: horse.left,
            width: horse.width,
            animationDuration: horse.animationDuration,
            animationDelay: horse.animationDelay,
          }}
        />
      ))}
    </div>
  );
};

export default BackgroundHorses;

