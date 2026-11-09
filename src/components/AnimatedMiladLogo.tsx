import React, { useState, useRef } from 'react';

interface AnimatedMiladLogoProps {
  variant?: 'banner' | 'emblem' | 'compact';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'custom';
  interactive?: boolean;
}

/**
 * AnimatedMiladLogo Component
 * Implements the kinetic animated logo emblem seen on miladsidogiri.id
 * Featuring the official Milad Sidogiri emblem and the precision-balanced
 * rotating compass needle with organic magnetic sway and interactive deflection.
 */
export const AnimatedMiladLogo: React.FC<AnimatedMiladLogoProps> = ({
  variant = 'banner',
  className = '',
  interactive = true,
}) => {
  const [needleRotation, setNeedleRotation] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Interactive mouse tracking deflection
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!interactive || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width * 0.7258; // Center of needle on banner
    const centerY = rect.top + rect.height * 0.4453;
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const angleRad = Math.atan2(mouseY - centerY, mouseX - centerX);
    const angleDeg = (angleRad * 180) / Math.PI + 90;
    setNeedleRotation(angleDeg);
    setIsHovered(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setNeedleRotation(0);
  };

  // 1. Full Banner Variant (as featured on the hero of miladsidogiri.id)
  if (variant === 'banner') {
    return (
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={`relative inline-block w-full max-w-[560px] aspect-[1292/736] select-none rounded-2xl overflow-hidden shadow-sm group ${className}`}
      >
        {/* Base Emblem Graphic */}
        <img
          src="/hero-milad-bg.png"
          alt="Milad Sidogiri ke-290"
          className="w-full h-full object-contain pointer-events-none drop-shadow-sm"
          loading="eager"
        />

        {/* Animated Precision Compass Needle Overlay */}
        <div
          style={{
            position: 'absolute',
            left: '72.581%',
            top: '44.531%',
            width: '10.217%',
            height: 'auto',
            aspectRatio: '1/1',
            transform: 'translate(-50%, -50%)',
          }}
          className="pointer-events-none"
        >
          <img
            src="/logo-needle.png"
            alt="Jarum Kompas Milad"
            style={{
              transform: isHovered
                ? `rotate(${needleRotation}deg)`
                : 'rotate(0deg)',
              transformOrigin: '50% 50%',
              transition: isHovered
                ? 'transform 120ms cubic-bezier(0.16, 1, 0.3, 1)'
                : 'transform 800ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className={`w-full h-full object-contain filter drop-shadow-[0_2px_6px_rgba(36,33,28,0.35)] ${
              !isHovered ? 'animate-needle-float' : ''
            }`}
          />
        </div>

        {/* Shimmer light sweep reflex across the dial */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
      </div>
    );
  }

  // 2. Focused Circular Emblem Variant (for Cards, Dialogs, or Featured Badges)
  if (variant === 'emblem') {
    return (
      <div
        ref={containerRef}
        onMouseMove={(e) => {
          if (!containerRef.current) return;
          const rect = containerRef.current.getBoundingClientRect();
          const centerX = rect.left + rect.width / 2;
          const centerY = rect.top + rect.height / 2;
          const angleDeg = (Math.atan2(e.clientY - centerY, e.clientX - centerX) * 180) / Math.PI + 90;
          setNeedleRotation(angleDeg);
          setIsHovered(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setNeedleRotation(0);
        }}
        className={`relative inline-flex items-center justify-center rounded-full bg-gradient-to-b from-[#f7f5ee] to-[#ede8db] border-2 border-[#c3b68b] shadow-md p-2 select-none overflow-hidden group cursor-pointer ${className}`}
      >
        {/* Subtle rotating circular ticks */}
        <div className="absolute inset-1.5 rounded-full border border-dashed border-[#8a7c4c]/30 pointer-events-none animate-spin-slow" />

        {/* Center compass dial background */}
        <div className="w-full h-full rounded-full bg-[#fcfbf9] flex items-center justify-center relative p-1">
          <img
            src="/compass-needle.png"
            alt="Kompas Milad"
            style={{
              transform: isHovered ? `rotate(${needleRotation}deg)` : 'rotate(0deg)',
              transformOrigin: '50% 50%',
              transition: isHovered
                ? 'transform 100ms ease-out'
                : 'transform 700ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            }}
            className={`w-full h-full object-contain filter drop-shadow-[0_2px_8px_rgba(138,124,76,0.35)] ${
              !isHovered ? 'animate-needle-float' : ''
            }`}
          />
        </div>

        {/* Glass reflection shine */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/20 to-transparent pointer-events-none" />
      </div>
    );
  }

  // 3. Compact Inline Variant (for Navbar or compact headers)
  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center justify-center select-none ${className}`}
    >
      <div className="w-9 h-9 rounded-full bg-[#ede9df] border border-[#c3b68b] flex items-center justify-center p-1 relative shadow-2xs">
        <img
          src="/compass-needle.png"
          alt="Kompas Milad"
          className="w-full h-full object-contain animate-needle-float filter drop-shadow-xs"
        />
      </div>
    </div>
  );
};
