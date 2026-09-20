"use client";

import React, { useState } from 'react';

type Region = 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg' | null;

interface BodySilhouetteProps {
  onSelectRegion: (region: Region) => void;
}

export default function BodySilhouette({ onSelectRegion }: BodySilhouetteProps) {
  const [selected, setSelected] = useState<Region>(null);

  const handleClick = (region: Region) => {
    setSelected(region);
    onSelectRegion(region);
  };

  const getFill = (region: Region) => selected === region ? '#ef4444' : '#1e3a8a'; // red-500 if selected, else blue-900

  return (
    <div className="flex justify-center my-6">
      <svg width="200" height="400" viewBox="0 0 200 400" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="100" cy="40" r="25" fill="#1e3a8a" />
        
        {/* Torso */}
        <rect x="70" y="70" width="60" height="120" rx="10" fill="#1e3a8a" />
        
        {/* Left Arm */}
        <rect 
          x="35" y="75" width="25" height="100" rx="12" 
          fill={getFill('leftArm')} 
          onClick={() => handleClick('leftArm')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
        
        {/* Right Arm */}
        <rect 
          x="140" y="75" width="25" height="100" rx="12" 
          fill={getFill('rightArm')} 
          onClick={() => handleClick('rightArm')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
        
        {/* Left Leg */}
        <rect 
          x="70" y="200" width="25" height="120" rx="12" 
          fill={getFill('leftLeg')} 
          onClick={() => handleClick('leftLeg')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
        
        {/* Right Leg */}
        <rect 
          x="105" y="200" width="25" height="120" rx="12" 
          fill={getFill('rightLeg')} 
          onClick={() => handleClick('rightLeg')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </svg>
    </div>
  );
}
