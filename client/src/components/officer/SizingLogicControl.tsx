// src/components/officer/SizingLogicControl.tsx
import React from 'react';

export type SizingLogic = 'compact' | 'balanced' | 'large';

interface SizingLogicControlProps {
  currentSizing: SizingLogic;
  onSizingChange: (sizing: SizingLogic) => void;
}

export function SizingLogicControl({ currentSizing, onSizingChange }: SizingLogicControlProps) {
  const options: { value: SizingLogic; label: string }[] = [
    { value: 'compact', label: 'Compact' },
    { value: 'balanced', label: 'Balanced' },
    { value: 'large', label: 'Large' },
  ];

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg p-4 w-full">
      <h4 className="text-amber-300 text-lg font-semibold mb-3 text-center">Example Size</h4>
      <div className="flex justify-center gap-2">
        {options.map(option => (
          <button
            key={option.value}
            onClick={() => onSizingChange(option.value)}
            className={`px-4 py-2 text-sm font-bold rounded transition-colors duration-200 ${
              currentSizing === option.value
                ? 'bg-amber-600 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
