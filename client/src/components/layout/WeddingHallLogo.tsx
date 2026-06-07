import React from 'react'

interface WeddingHallLogoProps {
  className?: string
  iconClassName?: string
  size?: number
}

export default function WeddingHallLogo({ className = 'h-9 w-9', iconClassName = 'text-[#3d5fa0] dark:text-[#8b9abf]', size = 20 }: WeddingHallLogoProps) {
  return (
    <div className={`flex items-center justify-center rounded-full bg-[#eef1f8] dark:bg-[#243660] border border-[#d0d8e8] dark:border-[#243660] ${className}`}>
      <svg 
        xmlns="http://www.w3.org/2000/svg" 
        viewBox="0 0 100 100" 
        width={size} 
        height={size} 
        className={iconClassName}
      >
        {/* Palace Dome / Arch Roof */}
        <path d="M 22 42 Q 50 18 78 42 Z" fill="currentColor" />
        
        {/* Arch trim */}
        <path d="M 20 42 L 80 42 L 80 46 L 20 46 Z" fill="#c8a96a" />
        
        {/* Heart emblem at the center of the dome */}
        <path d="M 50 34 C 48 30, 43 30, 43 33.5 C 43 36.5, 50 40, 50 40 C 50 40, 57 36.5, 57 33.5 C 57 30, 52 30, 50 34 Z" fill="#ffffff" />

        {/* 4 Classic Columns */}
        <rect x="26" y="46" width="6" height="28" fill="currentColor" rx="1"/>
        <rect x="39" y="46" width="6" height="28" fill="currentColor" rx="1"/>
        <rect x="55" y="46" width="6" height="28" fill="currentColor" rx="1"/>
        <rect x="68" y="46" width="6" height="28" fill="currentColor" rx="1"/>

        {/* Column Capitals/Bases */}
        <path d="M 24 46 L 34 46 M 37 46 L 47 46 M 53 46 L 63 46 M 66 46 L 76 46" stroke="#c8a96a" strokeWidth={2} strokeLinecap="round"/>
        <path d="M 24 74 L 34 74 M 37 74 L 47 74 M 53 74 L 63 74 M 66 74 L 76 74" stroke="#c8a96a" strokeWidth={2} strokeLinecap="round"/>

        {/* Grand Stairs / Foundation */}
        <path d="M 16 76 L 84 76 L 84 80 L 16 80 Z" fill="#c8a96a" />
        <path d="M 12 80 L 88 80 L 88 85 L 12 85 Z" fill="currentColor" />
      </svg>
    </div>
  )
}
