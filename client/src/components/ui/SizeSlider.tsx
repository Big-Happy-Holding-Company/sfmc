// src/components/ui/SizeSlider.tsx
import React from 'react';

interface SizeSliderProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
}

export function SizeSlider({ 
  value, 
  onChange, 
  min = 10, 
  max = 40, 
  step = 1, 
  label = 'Example Size' 
}: SizeSliderProps) {
  return (
    <div className="flex items-center gap-4 w-full">
      <label htmlFor="size-slider" className="text-sm font-medium text-slate-300 whitespace-nowrap">
        {label}
      </label>
      <input
        id="size-slider"
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
      />
      <span className="text-sm font-semibold text-amber-300 w-8 text-center">{value}px</span>
    </div>
  );
}
