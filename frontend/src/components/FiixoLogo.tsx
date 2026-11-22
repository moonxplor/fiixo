import React from 'react';

interface FiixoLogoProps {
  className?: string;
  size?: number | string;
}

/**
 * High-Resolution Pixel Pop 'fx' Logo
 * Pixel-perfect reproduction of the iconic retro 8-bit 'fx' logomark:
 * - Hot Pink/Magenta pixelated lowercase 'f'
 * - Electric Lime/Yellow pixelated 'x'
 * - Stepped cyan/teal drop shadow and deep navy borders
 */
export const FiixoLogo: React.FC<FiixoLogoProps> = ({ className = '', size = 36 }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 160 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ imageRendering: 'pixelated' }}
    >
      {/* Background / Base Grid Definition */}
      <defs>
        {/* Crisp pixel block definition */}
        <pattern id="pixelGrid" width="8" height="8" patternUnits="userSpaceOnUse" />
      </defs>

      {/* --- LAYER 1: Deep Cyan / Teal Offset Shadow for 'f' --- */}
      <g fill="#008080">
        {/* f drop shadow */}
        <rect x="52" y="16" width="30" height="10" />
        <rect x="74" y="26" width="16" height="18" />
        <rect x="42" y="34" width="14" height="20" />
        <rect x="52" y="44" width="18" height="60" />
        <rect x="26" y="52" width="48" height="12" />
        <rect x="62" y="52" width="16" height="12" />
      </g>

      {/* --- LAYER 2: Deep Cyan / Teal Offset Shadow for 'x' --- */}
      <g fill="#008080">
        <rect x="70" y="44" width="18" height="20" />
        <rect x="126" y="44" width="18" height="20" />
        <rect x="80" y="54" width="18" height="18" />
        <rect x="116" y="54" width="18" height="18" />
        <rect x="90" y="64" width="34" height="18" />
        <rect x="80" y="74" width="18" height="18" />
        <rect x="116" y="74" width="18" height="18" />
        <rect x="70" y="84" width="18" height="20" />
        <rect x="126" y="84" width="18" height="20" />
      </g>

      {/* --- LAYER 3: Dark Indigo / Midnight Outline for 'f' --- */}
      <g fill="#1F1B3E">
        {/* Top curve outline */}
        <rect x="44" y="8" width="36" height="6" />
        <rect x="76" y="14" width="6" height="22" />
        <rect x="52" y="26" width="6" height="18" />
        <rect x="36" y="14" width="8" height="30" />
        {/* Crossbar outline */}
        <rect x="14" y="44" width="22" height="6" />
        <rect x="14" y="50" width="6" height="14" />
        <rect x="14" y="60" width="22" height="6" />
        <rect x="56" y="44" width="18" height="6" />
        <rect x="68" y="50" width="6" height="14" />
        <rect x="48" y="60" width="26" height="6" />
        {/* Stem outline */}
        <rect x="36" y="64" width="6" height="36" />
        <rect x="36" y="96" width="18" height="6" />
        <rect x="48" y="64" width="6" height="36" />
      </g>

      {/* --- LAYER 4: Dark Indigo / Midnight Outline for 'x' --- */}
      <g fill="#1F1B3E">
        <rect x="62" y="36" width="18" height="6" />
        <rect x="62" y="42" width="6" height="18" />
        <rect x="118" y="36" width="18" height="6" />
        <rect x="130" y="42" width="6" height="18" />
        
        <rect x="80" y="50" width="6" height="8" />
        <rect x="112" y="50" width="6" height="8" />
        <rect x="88" y="56" width="6" height="10" />
        <rect x="104" y="56" width="6" height="10" />
        
        <rect x="88" y="68" width="6" height="10" />
        <rect x="104" y="68" width="6" height="10" />
        <rect x="80" y="76" width="6" height="8" />
        <rect x="112" y="76" width="6" height="8" />

        <rect x="62" y="76" width="6" height="18" />
        <rect x="62" y="94" width="18" height="6" />
        <rect x="130" y="76" width="6" height="18" />
        <rect x="118" y="94" width="18" height="6" />
      </g>

      {/* --- LAYER 5: Hot Pink Pixel 'f' Body --- */}
      <g fill="#FF3377">
        {/* Top Hook: pixel steps */}
        <rect x="46" y="10" width="10" height="8" />
        <rect x="54" y="8" width="12" height="8" />
        <rect x="64" y="10" width="12" height="8" />
        <rect x="70" y="16" width="8" height="16" />
        
        {/* Upper Stem */}
        <rect x="40" y="16" width="16" height="30" />
        
        {/* Crossbar */}
        <rect x="18" y="46" width="50" height="12" />
        
        {/* Main Stem */}
        <rect x="40" y="56" width="16" height="38" />
      </g>

      {/* High-res Highlight on 'f' */}
      <g fill="#FF66A3">
        <rect x="46" y="10" width="8" height="4" />
        <rect x="54" y="8" width="8" height="4" />
        <rect x="64" y="10" width="8" height="4" />
        <rect x="40" y="16" width="4" height="28" />
        <rect x="18" y="46" width="46" height="3" />
        <rect x="40" y="58" width="4" height="34" />
      </g>

      {/* --- LAYER 6: Electric Lime / Neon Yellow Pixel 'x' Body --- */}
      <g fill="#D8FF00">
        {/* Top-Left arm stepped */}
        <rect x="66" y="38" width="12" height="12" />
        <rect x="74" y="46" width="12" height="12" />
        
        {/* Top-Right arm stepped */}
        <rect x="120" y="38" width="12" height="12" />
        <rect x="112" y="46" width="12" height="12" />
        
        {/* Center Intersection Block */}
        <rect x="82" y="54" width="34" height="16" />
        <rect x="90" y="48" width="18" height="28" />
        
        {/* Bottom-Left arm stepped */}
        <rect x="74" y="66" width="12" height="12" />
        <rect x="66" y="74" width="12" height="14" />
        
        {/* Bottom-Right arm stepped */}
        <rect x="112" y="66" width="12" height="12" />
        <rect x="120" y="74" width="12" height="14" />
      </g>

      {/* High-res Highlight on 'x' */}
      <g fill="#EAFF66">
        <rect x="66" y="38" width="12" height="4" />
        <rect x="120" y="38" width="12" height="4" />
        <rect x="74" y="46" width="4" height="8" />
        <rect x="112" y="46" width="4" height="8" />
        <rect x="90" y="48" width="18" height="3" />
        <rect x="66" y="74" width="4" height="10" />
      </g>

      {/* Inner shadow on 'x' */}
      <g fill="#B4DD00">
        <rect x="66" y="84" width="12" height="4" />
        <rect x="120" y="84" width="12" height="4" />
        <rect x="90" y="73" width="18" height="3" />
      </g>
    </svg>
  );
};
