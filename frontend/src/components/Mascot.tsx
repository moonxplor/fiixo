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

  // State styling details
  const stateColor = {
    ready: '#7955F5',
    exploring: '#477BFF',
    thinking: '#FFD65A',
    debugging: '#FF579A',
    coding: '#7955F5',
    testing: '#00D084',
    waiting_for_approval: '#FF9900',
    completed: '#10B981',
    error: '#EF4444'
  }[state];

  return (
    <div className={`relative inline-flex items-center justify-center ${sizeMap[size]} ${className}`}>
      <svg 
        viewBox="0 0 120 120" 
        className="w-full h-full drop-shadow-md transition-transform duration-300 hover:scale-105"
      >
        {/* Antenna */}
        <line x1="60" y1="28" x2="60" y2="12" stroke="#241A35" strokeWidth="4" strokeLinecap="round" />
        <circle cx="60" cy="10" r="7" fill={stateColor} stroke="#241A35" strokeWidth="3" className="animate-pulse" />
        
        {/* Head / Body */}
        <rect 
          x="20" 
          y="26" 
          width="80" 
          height="76" 
          rx="22" 
          fill={stateColor} 
          stroke="#241A35" 
          strokeWidth="4" 
        />
        
        {/* Visor Screen */}
        <rect 
          x="28" 
          y="36" 
          width="64" 
          height="42" 
          rx="12" 
          fill="#1E162D" 
          stroke="#241A35" 
          strokeWidth="3" 
        />

        {/* Eyes based on state */}
        {state === 'thinking' ? (
          <>
            <circle cx="46" cy="54" r="5" fill="#FFD65A" className="animate-ping" />
            <circle cx="74" cy="54" r="5" fill="#FFD65A" />
          </>
        ) : state === 'debugging' ? (
          <>
            <text x="42" y="60" fill="#FF579A" fontSize="16" fontWeight="bold">x</text>
            <text x="70" y="60" fill="#FF579A" fontSize="16" fontWeight="bold">x</text>
          </>
        ) : state === 'completed' ? (
          <>
            <path d="M40 54 Q46 48 52 54" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
            <path d="M68 54 Q74 48 80 54" stroke="#10B981" strokeWidth="3" fill="none" strokeLinecap="round" />
          </>
        ) : (
          <>
            <circle cx="46" cy="54" r="6" fill="#FFD65A" />
            <circle cx="74" cy="54" r="6" fill="#FFD65A" />
            <circle cx="48" cy="52" r="2" fill="#FFFFFF" />
            <circle cx="76" cy="52" r="2" fill="#FFFFFF" />
          </>
        )}

        {/* Mouth */}
        {state === 'ready' || state === 'completed' ? (
          <path d="M46 68 Q60 78 74 68" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" fill="none" />
        ) : state === 'coding' ? (
          <rect x="50" y="68" width="20" height="4" rx="2" fill="#FFD65A" />
        ) : (
          <line x1="50" y1="70" x2="70" y2="70" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" />
        )}

        {/* Cheek blushes */}
        <circle cx="35" cy="62" r="3" fill="#FF579A" opacity="0.8" />
        <circle cx="85" cy="62" r="3" fill="#FF579A" opacity="0.8" />

        {/* Small Legs */}
        <rect x="40" y="102" width="10" height="8" rx="4" fill="#241A35" />
        <rect x="70" y="102" width="10" height="8" rx="4" fill="#241A35" />
      </svg>
      
      {/* Floating Status Ring Indicator */}
      <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: stateColor }}></span>
        <span className="relative inline-flex rounded-full h-4 w-4 border-2 border-white" style={{ backgroundColor: stateColor }}></span>
      </span>
    </div>
  );
};
