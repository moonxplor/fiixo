import React from 'react';

export type MascotState = 
  | 'ready' 
  | 'exploring' 
  | 'thinking' 
  | 'debugging' 
  | 'coding' 
  | 'testing' 
  | 'waiting_for_approval' 
  | 'completed' 
  | 'error';

interface MascotProps {
  state?: MascotState;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const Mascot: React.FC<MascotProps> = ({ 
  state = 'ready', 
  size = 'md',
  className = '' 
}) => {
  const sizeMap = {
    sm: 'w-10 h-10',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
    xl: 'w-36 h-36'
  };

  // Vector Pop Art Palette: Bold solid saturated tones against dark outlines
  const stateColor = {
    ready: '#00D2FF',
    exploring: '#7C4DFF',
    thinking: '#FF3366',
    debugging: '#FF5252',
    coding: '#00E676',
    testing: '#00E676',
    waiting_for_approval: '#FF9100',
    completed: '#00E676',
    error: '#FF1744'
  }[state];

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg 
        viewBox="0 0 120 120" 
        className="w-full h-full filter drop-shadow-[3px_3px_0px_#111827] transition-transform duration-200 hover:scale-110 hover:-rotate-3"
      >
        {/* Antenna */}
        <line x1="60" y1="28" x2="60" y2="12" stroke="#111827" strokeWidth="5" strokeLinecap="round" />
        <circle cx="60" cy="10" r="8" fill="#FF3366" stroke="#111827" strokeWidth="4" />
        
        {/* Vector Pop Rounded Head Block */}
        <rect 
          x="20" 
          y="26" 
          width="80" 
          height="74" 
          rx="18" 
          fill={stateColor} 
          stroke="#111827" 
          strokeWidth="4.5" 
        />
        
        {/* Inner Comic Visor Box */}
        <rect 
          x="28" 
          y="36" 
          width="64" 
          height="40" 
          rx="10" 
          fill="#1E2030" 
          stroke="#111827" 
          strokeWidth="3.5" 
        />

        {/* Big Vector Pop Glossy Eyes */}
        {state === 'thinking' ? (
          <>
            <circle cx="46" cy="54" r="7" fill="#FF3366" stroke="#111827" strokeWidth="2.5" />
            <circle cx="74" cy="54" r="7" fill="#00D2FF" stroke="#111827" strokeWidth="2.5" />
          </>
        ) : state === 'debugging' ? (
          <>
            <text x="40" y="60" fill="#FF3366" fontSize="18" fontWeight="900" fontFamily="sans-serif">X</text>
            <text x="68" y="60" fill="#FF3366" fontSize="18" fontWeight="900" fontFamily="sans-serif">X</text>
          </>
        ) : state === 'completed' ? (
          <>
            <path d="M38 54 Q46 46 54 54" stroke="#00E676" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M66 54 Q74 46 82 54" stroke="#00E676" strokeWidth="4" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <ellipse cx="46" cy="53" rx="8" ry="10" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
            <ellipse cx="74" cy="53" rx="8" ry="10" fill="#FFFFFF" stroke="#111827" strokeWidth="3" />
            <circle cx="48" cy="54" r="4.5" fill="#111827" />
            <circle cx="76" cy="54" r="4.5" fill="#111827" />
            <circle cx="46" cy="51" r="2" fill="#FFFFFF" />
            <circle cx="74" cy="51" r="2" fill="#FFFFFF" />
          </>
        )}

        {/* Big Expressive Comic Mouth */}
        {state === 'ready' || state === 'completed' ? (
          <path d="M44 65 Q60 78 76 65" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" fill="none" />
        ) : state === 'coding' ? (
          <rect x="48" y="65" width="24" height="5" rx="2.5" fill="#00E676" stroke="#111827" strokeWidth="2" />
        ) : (
          <line x1="48" y1="67" x2="72" y2="67" stroke="#FFFFFF" strokeWidth="4" strokeLinecap="round" />
        )}

        {/* Pop Dots Cheeks */}
        <circle cx="34" cy="62" r="4" fill="#FF3366" stroke="#111827" strokeWidth="1.5" />
        <circle cx="86" cy="62" r="4" fill="#FF3366" stroke="#111827" strokeWidth="1.5" />

        {/* Cartoon Feet */}
        <rect x="38" y="100" width="12" height="9" rx="4" fill="#111827" />
        <rect x="70" y="100" width="12" height="9" rx="4" fill="#111827" />
      </svg>
      
      {/* Hard Shadow Indicator */}
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
        <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-[#111827]" style={{ backgroundColor: stateColor }}></span>
      </span>
    </div>
  );
};
