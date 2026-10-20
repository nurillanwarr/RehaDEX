"use client";

import React, { useState } from 'react';

export type RegionKey = 'leftArm' | 'rightArm' | 'leftLeg' | 'rightLeg';

export const REGION_LABELS: Record<RegionKey, string> = {
  leftArm: 'Lengan Kiri',
  rightArm: 'Lengan Kanan',
  leftLeg: 'Kaki Kiri',
  rightLeg: 'Kaki Kanan',
};

interface BodySilhouetteProps {
  onSelectRegions: (regions: RegionKey[]) => void;
}

export default function BodySilhouette({ onSelectRegions }: BodySilhouetteProps) {
  const [selected, setSelected] = useState<RegionKey[]>([]);

  const handleToggle = (region: RegionKey) => {
    setSelected(prev => {
      const next = prev.includes(region)
        ? prev.filter(r => r !== region)
        : [...prev, region];
      onSelectRegions(next);
      return next;
    });
  };

  const getFill = (region: RegionKey) =>
    selected.includes(region) ? '#ef4444' : '#1e3a8a';

  return (
    <div className="flex flex-col items-center my-4">
      <svg width="200" height="350" viewBox="0 0 200 350" xmlns="http://www.w3.org/2000/svg">
        {/* Head */}
        <circle cx="100" cy="40" r="25" fill="#1e3a8a" />

        {/* Torso */}
        <rect x="70" y="70" width="60" height="120" rx="10" fill="#1e3a8a" />

        {/* Left Arm */}
        <rect
          x="35"
          y="75"
          width="25"
          height="100"
          rx="12"
          fill={getFill('leftArm')}
          onClick={() => handleToggle('leftArm')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />

        {/* Right Arm */}
        <rect
          x="140"
          y="75"
          width="25"
          height="100"
          rx="12"
          fill={getFill('rightArm')}
          onClick={() => handleToggle('rightArm')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />

        {/* Left Leg */}
        <rect
          x="70"
          y="200"
          width="25"
          height="120"
          rx="12"
          fill={getFill('leftLeg')}
          onClick={() => handleToggle('leftLeg')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />

        {/* Right Leg */}
        <rect
          x="105"
          y="200"
          width="25"
          height="120"
          rx="12"
          fill={getFill('rightLeg')}
          onClick={() => handleToggle('rightLeg')}
          className="cursor-pointer hover:opacity-80 transition-opacity"
        />
      </svg>

      {/* Tombol bantu pilih banyak bagian sekaligus */}
      <div className="flex flex-wrap justify-center gap-2 mt-2">
        {(['leftArm', 'rightArm', 'leftLeg', 'rightLeg'] as RegionKey[]).map(r => {
          const active = selected.includes(r);
          return (
            <button
              key={r}
              type="button"
              onClick={() => handleToggle(r)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition ${
                active
                  ? 'bg-red-500 text-white border-red-500 shadow-sm'
                  : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-blue-400'
              }`}
            >
              {active ? '✓ ' : '+ '}
              {REGION_LABELS[r]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
