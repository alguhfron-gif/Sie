import React, { useState, useEffect } from 'react';
import {
  CUSTOM_LOGO_STORAGE_KEY,
  CUSTOM_LOGO_EVENT,
  getLocalCustomLogo,
  saveCustomLogo,
  subscribeCustomLogo,
} from '../services/logoService';

export { CUSTOM_LOGO_STORAGE_KEY, CUSTOM_LOGO_EVENT };

export const getCustomLogo = (): string | null => {
  return getLocalCustomLogo();
};

export const setCustomLogo = (dataUrlOrLink: string | null) => {
  saveCustomLogo(dataUrlOrLink);
};

interface MiladLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'custom';
  variant?: 'full' | 'badge' | 'icon' | 'watermark' | 'gold-seal';
  withText?: boolean;
  overrideSrc?: string | null;
  onClick?: () => void;
}

export const MiladLogo: React.FC<MiladLogoProps> = ({
  className = '',
  size = 'md',
  variant = 'badge',
  withText = false,
  overrideSrc,
  onClick,
}) => {
  const [customLogo, setCustomLogoState] = useState<string | null>(overrideSrc || getLocalCustomLogo());

  useEffect(() => {
    if (overrideSrc !== undefined) {
      setCustomLogoState(overrideSrc);
      return;
    }

    // 1. Local events listener
    const updateLogo = () => {
      setCustomLogoState(getLocalCustomLogo());
    };
    window.addEventListener(CUSTOM_LOGO_EVENT, updateLogo);
    window.addEventListener('storage', updateLogo);

    // 2. Real-time Firestore Cloud listener across all devices
    const unsubscribeCloud = subscribeCustomLogo((cloudLogo) => {
      setCustomLogoState(cloudLogo);
    });

    return () => {
      window.removeEventListener(CUSTOM_LOGO_EVENT, updateLogo);
      window.removeEventListener('storage', updateLogo);
      unsubscribeCloud();
    };
  }, [overrideSrc]);

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20',
    '2xl': 'w-28 h-28',
    custom: '',
  };

  const selectedSizeClass = sizeClasses[size] || sizeClasses.md;

  // Render watermark variant
  if (variant === 'watermark') {
    if (customLogo) {
      return (
        <div className={`flex items-center justify-center ${selectedSizeClass} ${className} opacity-10 pointer-events-none select-none`}>
          <img
            src={customLogo}
            alt="Milad Watermark"
            className="w-full h-full object-contain filter grayscale"
            referrerPolicy="no-referrer"
          />
        </div>
      );
    }
    return (
      <svg
        viewBox="0 0 400 400"
        className={`${selectedSizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="200" cy="200" r="180" stroke="#005a2b" strokeWidth="6" strokeDasharray="12 8" opacity="0.12" />
        <circle cx="200" cy="200" r="150" stroke="#005a2b" strokeWidth="4" opacity="0.12" />
        <polygon
          points="200,60 235,135 315,135 250,185 275,260 200,215 125,260 150,185 85,135 165,135"
          stroke="#005a2b"
          strokeWidth="4"
          fill="none"
          opacity="0.1"
        />
        <text
          x="200"
          y="205"
          textAnchor="middle"
          fill="#005a2b"
          opacity="0.15"
          fontSize="36"
          fontWeight="900"
          letterSpacing="4"
          fontFamily="serif"
        >
          MILAD SIDOGIRI
        </text>
        <text
          x="200"
          y="240"
          textAnchor="middle"
          fill="#005a2b"
          opacity="0.12"
          fontSize="20"
          fontWeight="700"
          letterSpacing="2"
        >
          PONDOK PESANTREN SIDOGIRI
        </text>
      </svg>
    );
  }

  // Render gold seal variant
  if (variant === 'gold-seal') {
    if (customLogo) {
      return (
        <div className={`relative flex items-center justify-center p-1 rounded-full bg-gradient-to-tr from-amber-600 via-yellow-400 to-amber-700 shadow-md ${selectedSizeClass} ${className}`}>
          <div className="w-full h-full rounded-full bg-white flex items-center justify-center p-1 overflow-hidden">
            <img
              src={customLogo}
              alt="Milad Seal"
              className="w-full h-full object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      );
    }
    return (
      <svg
        viewBox="0 0 200 200"
        className={`${selectedSizeClass} ${className}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="goldGradSeal" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="35%" stopColor="#f59e0b" />
            <stop offset="70%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
          <linearGradient id="greenCenterGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#005a2b" />
            <stop offset="100%" stopColor="#003518" />
          </linearGradient>
        </defs>

        {/* Outer Rosette Ring */}
        <circle cx="100" cy="100" r="92" fill="url(#goldGradSeal)" />
        <circle cx="100" cy="100" r="84" fill="#ffffff" />
        <circle cx="100" cy="100" r="80" fill="url(#greenCenterGrad)" />
        <circle cx="100" cy="100" r="74" stroke="url(#goldGradSeal)" strokeWidth="2" strokeDasharray="3 3" />

        {/* 8-pointed star */}
        <g transform="translate(100, 100) scale(0.65)">
          <rect x="-60" y="-60" width="120" height="120" rx="10" fill="none" stroke="url(#goldGradSeal)" strokeWidth="4" />
          <rect x="-60" y="-60" width="120" height="120" rx="10" transform="rotate(45)" fill="none" stroke="url(#goldGradSeal)" strokeWidth="4" />
        </g>

        {/* Center Emblem */}
        <text
          x="100"
          y="90"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="18"
          fontWeight="900"
          letterSpacing="2"
          fontFamily="serif"
        >
          MILAD
        </text>
        <text
          x="100"
          y="112"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13"
          fontWeight="800"
          letterSpacing="1.5"
        >
          SIDOGIRI
        </text>
        <text
          x="100"
          y="128"
          textAnchor="middle"
          fill="#fde68a"
          fontSize="9"
          fontWeight="700"
          letterSpacing="1"
        >
          PENGANUGERAHAN
        </text>
      </svg>
    );
  }

  // If custom logo image is uploaded/provided, render the custom image!
  if (customLogo) {
    return (
      <div
        className={`inline-flex items-center space-x-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
        onClick={onClick}
      >
        <div className={`${selectedSizeClass} shrink-0 flex items-center justify-center relative overflow-hidden rounded-lg`}>
          <img
            src={customLogo}
            alt="Milad Sidogiri Logo"
            className="w-full h-full object-contain drop-shadow-sm"
            referrerPolicy="no-referrer"
          />
        </div>

        {withText && (
          <div className="flex flex-col text-left leading-tight">
            <span className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
              <span>MILAD SIDOGIRI</span>
              <span className="text-[9px] bg-emerald-600 text-emerald-100 px-1.5 py-0.2 rounded font-extrabold">
                PENGANUGERAHAN
              </span>
            </span>
            <span className="text-[10px] text-emerald-300 font-bold">
              Pondok Pesantren Sidogiri
            </span>
          </div>
        )}
      </div>
    );
  }

  // Default Vector SVG Logo
  return (
    <div
      className={`inline-flex items-center space-x-2 ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
    >
      <svg
        viewBox="0 0 160 160"
        className={`${selectedSizeClass} shrink-0 drop-shadow-sm`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id="miladGreen" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#00a65a" />
            <stop offset="40%" stopColor="#005a2b" />
            <stop offset="100%" stopColor="#003518" />
          </linearGradient>
          <linearGradient id="miladGold" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="40%" stopColor="#f59e0b" />
            <stop offset="80%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="miladGoldSoft" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="100%" stopColor="#fef3c7" />
          </linearGradient>
          <filter id="miladGlow" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer Circular Medallion */}
        <circle cx="80" cy="80" r="76" fill="url(#miladGreen)" />
        <circle cx="80" cy="80" r="73" stroke="url(#miladGold)" strokeWidth="2.5" />
        <circle cx="80" cy="80" r="68" stroke="url(#miladGold)" strokeWidth="1" strokeDasharray="3 3" opacity="0.8" />

        {/* 8-pointed Islamic Star Motif (Khatam) */}
        <g transform="translate(80, 78) scale(0.85)">
          <rect
            x="-45"
            y="-45"
            width="90"
            height="90"
            rx="8"
            fill="#004220"
            stroke="url(#miladGold)"
            strokeWidth="2.5"
            opacity="0.9"
          />
          <rect
            x="-45"
            y="-45"
            width="90"
            height="90"
            rx="8"
            transform="rotate(45)"
            fill="#004220"
            stroke="url(#miladGold)"
            strokeWidth="2.5"
            opacity="0.9"
          />
        </g>

        {/* Golden Dome / Crescent & Star Header Crest */}
        <path
          d="M66 54 Q80 38 94 54 Q80 46 66 54 Z"
          fill="url(#miladGold)"
          filter="url(#miladGlow)"
        />
        {/* Star atop dome */}
        <polygon
          points="80,36 82,41 87,41 83,44 85,49 80,46 75,49 77,44 73,41 78,41"
          fill="url(#miladGold)"
        />

        {/* Text Center: MILAD SIDOGIRI */}
        <text
          x="80"
          y="72"
          textAnchor="middle"
          fill="url(#miladGoldSoft)"
          fontSize="17"
          fontWeight="900"
          letterSpacing="2.5"
          fontFamily="system-ui, -apple-system, sans-serif"
          filter="url(#miladGlow)"
        >
          MILAD
        </text>
        <text
          x="80"
          y="90"
          textAnchor="middle"
          fill="#ffffff"
          fontSize="13"
          fontWeight="800"
          letterSpacing="2"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          SIDOGIRI
        </text>

        {/* Gold Ribbon Banner at Bottom */}
        <g transform="translate(0, 10)">
          <path
            d="M 28 108 L 132 108 L 126 122 L 34 122 Z"
            fill="url(#miladGold)"
          />
          <path
            d="M 28 108 L 20 115 L 28 122 L 34 122 L 28 108 Z"
            fill="#92400e"
          />
          <path
            d="M 132 108 L 140 115 L 132 122 L 126 122 L 132 108 Z"
            fill="#92400e"
          />
          <text
            x="80"
            y="118.5"
            textAnchor="middle"
            fill="#16221b"
            fontSize="8.5"
            fontWeight="900"
            letterSpacing="1"
          >
            SIE PENGANUGERAHAN
          </text>
        </g>
      </svg>

      {withText && (
        <div className="flex flex-col text-left leading-tight">
          <span className="text-xs sm:text-sm font-black tracking-tight text-white flex items-center gap-1.5">
            <span>MILAD SIDOGIRI</span>
            <span className="text-[9px] bg-emerald-600 text-emerald-100 px-1.5 py-0.2 rounded font-extrabold">
              PENGANUGERAHAN
            </span>
          </span>
          <span className="text-[10px] text-emerald-300 font-bold">
            Pondok Pesantren Sidogiri
          </span>
        </div>
      )}
    </div>
  );
};

